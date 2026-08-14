/**
 * Resolving a course's supervisor (the professor of record) from a course doc.
 *
 * Course docs live in two places. `semesters/{Sem}/courses/{code : instructor}`
 * is canonical and is what the auto-fetch runner and the Excel uploader write.
 * The top-level `courses` collection predates it and still holds rows the
 * semester backfill never reached — mostly legacy per-section docs keyed by
 * class number. An assignment pointing at one of those resolves to nothing in
 * the canonical map, which is how supervisors end up marked "unknown" on an
 * OnBase export.
 *
 * These helpers are pure so the matching rules can be tested without Firestore.
 */

export interface SupervisorInfo {
  supervisorFirst: string;
  supervisorLast: string;
  supervisorEmail: string;
}

/** What a row shows when neither collection has the course. */
export const UNKNOWN = 'unknown';

export const UNKNOWN_SUPERVISOR: SupervisorInfo = {
  supervisorFirst: UNKNOWN,
  supervisorLast: UNKNOWN,
  supervisorEmail: UNKNOWN,
};

/**
 * Course keys are hand-edited and arrive with inconsistent spacing and case
 * ("EEL3135 : Wong,Tan Foon" vs "eel3135:Wong, Tan Foon"). Normalize before
 * comparing so those are the same course.
 */
export function normalizeCourseKey(raw: string | undefined | null): string {
  return String(raw ?? '')
    .replace(/\s*:\s*/, ' : ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Split "EEL3135 : Wong,Tan Foon" into its course code and instructor halves.
 * Returns empty strings for a key that doesn't carry both.
 */
export function splitCourseKey(raw: string | undefined | null): {
  code: string;
  instructor: string;
} {
  const s = String(raw ?? '').trim();
  const i = s.indexOf(':');
  if (i < 0) {
    return { code: s.replace(/\s+/g, ' ').trim().toUpperCase(), instructor: '' };
  }
  return {
    code: s.slice(0, i).replace(/\s+/g, ' ').trim().toUpperCase(),
    instructor: s
      .slice(i + 1)
      .replace(/\s+/g, ' ')
      .trim(),
  };
}

function firstOf(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '').trim();
  return String(value ?? '').trim();
}

/**
 * Read a supervisor off a course doc. Names are stored "Last,First" on both
 * collections; a name with no comma is treated as a surname, matching how the
 * grid rendered these before the fallback existed.
 */
export function supervisorFromCourseDoc(
  data: Record<string, unknown> | undefined | null
): SupervisorInfo | undefined {
  if (!data) return undefined;

  const profName = firstOf(data.professor_names);
  const email = firstOf(data.professor_emails);
  if (!profName && !email) return undefined;

  const comma = profName.indexOf(',');
  const last = comma >= 0 ? profName.slice(0, comma).trim() : profName;
  const first = comma >= 0 ? profName.slice(comma + 1).trim() : '';

  return {
    supervisorFirst: first,
    supervisorLast: last,
    supervisorEmail: email,
  };
}

/** True when at least one field carries something other than the placeholder. */
export function isResolved(info: SupervisorInfo | undefined): boolean {
  if (!info) return false;
  return Boolean(
    (info.supervisorFirst && info.supervisorFirst !== UNKNOWN) ||
      (info.supervisorLast && info.supervisorLast !== UNKNOWN) ||
      (info.supervisorEmail && info.supervisorEmail !== UNKNOWN)
  );
}

export interface CourseCandidate {
  code: string;
  instructor: string;
  supervisor: SupervisorInfo;
}

/**
 * Last-resort match for a course whose instructor half doesn't line up with any
 * doc — a renamed or reformatted professor name, say.
 *
 * Only resolves when the code maps to exactly one distinct supervisor. Two
 * professors teaching the same code is a real case, and guessing between them
 * would put the wrong name on a payroll record, so ambiguity stays unknown.
 */
export function resolveByCodeAlone(
  candidates: CourseCandidate[],
  code: string
): SupervisorInfo | undefined {
  const wanted = code.trim().toUpperCase();
  if (!wanted) return undefined;

  const matches = candidates.filter((c) => c.code.toUpperCase() === wanted);
  if (!matches.length) return undefined;

  const distinct = new Set(
    matches.map(
      (m) =>
        `${m.supervisor.supervisorFirst}|${m.supervisor.supervisorLast}|${m.supervisor.supervisorEmail}`.toLowerCase()
    )
  );
  return distinct.size === 1 ? matches[0].supervisor : undefined;
}

/**
 * Resolve one assignment's supervisor, preferring the canonical semester map
 * and falling back to the top-level collection. Returns the placeholder only
 * when every route misses.
 */
export function resolveSupervisor(
  classCodes: string | undefined,
  semesterMap: Record<string, SupervisorInfo>,
  fallbackMap: Record<string, SupervisorInfo> = {},
  fallbackCandidates: CourseCandidate[] = []
): { supervisor: SupervisorInfo; source: 'semesters' | 'courses' | 'none' } {
  const key = normalizeCourseKey(classCodes);
  if (!key) return { supervisor: UNKNOWN_SUPERVISOR, source: 'none' };

  const canonical = semesterMap[key];
  if (isResolved(canonical)) {
    return { supervisor: canonical, source: 'semesters' };
  }

  const fallback = fallbackMap[key];
  if (isResolved(fallback)) {
    return { supervisor: fallback, source: 'courses' };
  }

  const { code } = splitCourseKey(classCodes);
  const byCode = resolveByCodeAlone(fallbackCandidates, code);
  if (isResolved(byCode)) {
    return { supervisor: byCode as SupervisorInfo, source: 'courses' };
  }

  return { supervisor: UNKNOWN_SUPERVISOR, source: 'none' };
}
