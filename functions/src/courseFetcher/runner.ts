// Orchestrates a single fetch run: fetch -> persist normalized data ->
// write a run record -> update the parent config's status fields.
//
// All Firestore writes go through batched writes with a hard cap so we
// never exceed the 500-op batch limit.

import * as admin from 'firebase-admin';
import { fetchCoursesForConfig } from './pipeline';
import {
  computeNextRefreshAt,
  toConfigSnapshot,
  type ValidatedConfig,
} from './validation';
import type {
  CancelCheck,
  FetchResult,
  NormalizedCourse,
  NormalizedMeetingTime,
  NormalizedSection,
} from './types';
import { emailsToUsernames } from '../email';

const BATCH_LIMIT = 450; // leave headroom below the 500-op Firestore limit

// Map a config's (term, year) to the semester doc name the app uses
// everywhere else. The existing collection is `semesters/{name}/courses/*`
// with names like 'Spring 2026' / 'Fall 2026', so we match that casing.
function semesterNameFromConfig(
  term: ValidatedConfig['term'],
  year: number
): string {
  const cap = term.charAt(0).toUpperCase() + term.slice(1);
  return `${cap} ${year}`;
}

function formatTimeRange(
  start: string | undefined,
  end: string | undefined,
  raw: string | undefined
): string {
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return raw ?? '';
}

function toLegacyMeetingTimes(times: NormalizedMeetingTime[]): Array<{
  day: string;
  time: string;
  location: string;
}> {
  if (!Array.isArray(times) || times.length === 0) return [];
  return times.map((m) => ({
    day: (m.day ?? '').trim(),
    time: formatTimeRange(m.startTime, m.endTime, m.rawTime),
    location: (m.location ?? '').trim(),
  }));
}

// Names that mean "no real instructor on file". Provider data and old Excel
// rosters use a mix of these — we collapse them all onto 'TBA' so a course
// has at most one no-instructor doc, and so the run cleanup below can find
// every legacy placeholder shape under a known set of doc ids.
const PLACEHOLDER_INSTRUCTOR_LOWER = new Set([
  'tba',
  'undef',
  'undefined',
  'unknown',
  '-',
]);

// All doc-id instructor segments we treat as placeholders during cleanup.
// 'TBA' is the canonical form we write going forward; the rest are legacy
// values that older runs / Excel uploads may have left behind.
const PLACEHOLDER_INSTRUCTOR_DOC_KEYS = [
  'TBA',
  'undef',
  'undefined',
  'unknown',
  '-',
];

function isPlaceholderInstructor(key: string): boolean {
  return PLACEHOLDER_INSTRUCTOR_LOWER.has(key.toLowerCase());
}

// Stable instructor key used for both the doc id and section grouping. We
// normalize the joined name string so two sections of the same course taught
// by the same prof land on the same doc — auto-fetch's normalize step keeps
// names consistent within a single run, so a trim/whitespace-collapse is
// enough. Falls back to 'TBA' when a section has no listed instructor or
// when the source data uses a placeholder string ('undef', '-', etc.); see
// PLACEHOLDER_INSTRUCTOR_LOWER.
function instructorKeyFromSection(section: NormalizedSection): string {
  const joined = section.instructors
    .map((i) => (i.name ?? '').trim())
    .filter(Boolean)
    .join(', ');
  const cleaned = joined.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'TBA';
  if (isPlaceholderInstructor(cleaned)) return 'TBA';
  return cleaned;
}

// Doc id used by the live semester layout. Matches the Excel upload format
// (`UploadPanel.tsx`) so re-runs and re-uploads merge into the same doc.
function semesterCourseDocId(code: string, instructorKey: string): string {
  // Firestore doc ids cannot contain '/'. Other punctuation in instructor
  // names (commas, periods) is fine.
  const safeInstructor = instructorKey.replace(/\//g, '-');
  return `${code} : ${safeInstructor}`;
}

function sumNumericStrings(values: Array<string | undefined>): string {
  let total = 0;
  let any = false;
  for (const v of values) {
    if (v == null || v === '') continue;
    const n = Number(v);
    if (Number.isFinite(n)) {
      total += n;
      any = true;
    }
  }
  return any ? String(total) : '';
}

// Build a doc matching the existing semester-course schema used by the
// Excel upload flow. One doc per (course, instructor) — multiple sections
// taught by the same prof get merged so the catalog isn't fragmented per
// section. The `source` + `sourceConfigId` fields let the UI distinguish
// auto-fetched rows from manually uploaded ones.
function buildSemesterCourseDoc(
  course: NormalizedCourse,
  sections: NormalizedSection[],
  semesterName: string,
  configId: string,
  provider: string
): Record<string, unknown> {
  // Use the first section as the source of truth for instructor identity —
  // grouping guarantees they all share the same instructor key.
  const head = sections[0];
  const instructorNames = head.instructors.map((i) => i.name).filter(Boolean);
  const instructorEmails = head.instructors
    .map((i) => i.email)
    .filter((e): e is string => Boolean(e));

  const classNumbers = sections.map((s) => s.classNumber).filter(Boolean);
  const sectionNumbers = sections
    .map((s) => s.sectionNumber)
    .filter((s): s is string => Boolean(s));
  const meetingTimes = sections.flatMap((s) =>
    toLegacyMeetingTimes(s.meetingTimes)
  );

  return {
    // Backward-compat single-string field for consumers reading
    // `class_number`. New code should prefer `class_numbers` (array).
    class_number: classNumbers.join(', '),
    class_numbers: classNumbers,
    code: course.code,
    codeWithSpace: course.codeWithSpace,
    title: course.title,
    credits: course.credits ?? '',
    department: (course.department ?? '').toUpperCase(),
    department_name: course.departmentName ?? '',
    professor_names: instructorNames.join(', '),
    professor_emails: instructorEmails,
    professor_usernames: emailsToUsernames(instructorEmails),
    enrollment_cap: sumNumericStrings(
      sections.map((s) =>
        s.enrollmentCap != null ? String(s.enrollmentCap) : undefined
      )
    ),
    enrolled: sumNumericStrings(
      sections.map((s) => (s.enrolled != null ? String(s.enrolled) : undefined))
    ),
    title_section: sectionNumbers.join(', '),
    section_count: sections.length,
    semester: semesterName,
    meeting_times: meetingTimes,
    source: 'auto-fetch',
    sourceConfigId: configId,
    sourceProvider: provider,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function now(): FirebaseFirestore.FieldValue {
  return admin.firestore.FieldValue.serverTimestamp();
}

export interface RunContext {
  db: FirebaseFirestore.Firestore;
  configId: string;
  config: ValidatedConfig;
  triggeredBy: 'manual' | 'scheduled';
  triggeredByUid?: string;
  leaseToken?: string;
  // When provided, only courses whose code (uppercased) is in this set are
  // persisted. Used by the Preview → Apply flow so admins can curate the
  // write set without widening the config's filters.
  includeCourses?: string[];
}

export interface RunOutcome {
  runId: string;
  status: FetchResult['status'];
  rawCount: number;
  courseCount: number;
  sectionCount: number;
  durationMs: number;
  errors: string[];
  warnings: string[];
}

async function commitCoursesAndSections(
  db: FirebaseFirestore.Firestore,
  configId: string,
  provider: string,
  config: ValidatedConfig,
  result: FetchResult,
  includeCourses?: string[],
  checkCancel?: CancelCheck
): Promise<{ cancelled: boolean }> {
  const catalog = db.collection('catalog');
  const termCode =
    (result.providerMeta &&
      (result.providerMeta as Record<string, unknown>).termCode) ||
    '';
  const prefix = `${provider}:${termCode}`;

  const includeSet =
    includeCourses && includeCourses.length > 0
      ? new Set(includeCourses.map((c) => c.trim().toUpperCase()))
      : null;
  const isIncluded = (code: string) =>
    includeSet === null || includeSet.has(code.trim().toUpperCase());

  const coursesToWrite = includeSet
    ? result.courses.filter((c) => isIncluded(c.code))
    : result.courses;
  const sectionsToWrite = includeSet
    ? result.sections.filter((s) => isIncluded(s.courseCode))
    : result.sections;

  // Group sections by (courseCode, instructorKey) so we emit one merged
  // semester-course doc per (course, professor) pair instead of one per
  // section. Inner map keys on the instructor key so a 4-section course
  // taught by 2 profs produces 2 docs (one per prof, with that prof's
  // sections merged), not 4.
  const sectionsByCourseInstructor = new Map<
    string,
    Map<string, NormalizedSection[]>
  >();
  for (const section of sectionsToWrite) {
    const courseKey = section.courseCode;
    const instructorKey = instructorKeyFromSection(section);
    let byInstructor = sectionsByCourseInstructor.get(courseKey);
    if (!byInstructor) {
      byInstructor = new Map();
      sectionsByCourseInstructor.set(courseKey, byInstructor);
    }
    const bucket = byInstructor.get(instructorKey);
    if (bucket) bucket.push(section);
    else byInstructor.set(instructorKey, [section]);
  }

  const semesterName = semesterNameFromConfig(config.term, config.year);
  const semesterRef = db.collection('semesters').doc(semesterName);
  const semesterCourses = semesterRef.collection('courses');

  type Op = () => void;
  let batch = db.batch();
  let ops = 0;
  let cancelled = false;
  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
    if (checkCancel && (await checkCancel())) {
      cancelled = true;
    }
  };
  const add = async (op: Op) => {
    if (cancelled) return;
    op();
    ops++;
    if (ops >= BATCH_LIMIT) await flush();
  };

  // Ensure the semester doc exists so the admin UI's semester list includes
  // it even on a fresh term. `merge: true` preserves `hidden` if already set.
  await add(() =>
    batch.set(
      semesterRef,
      { semester: semesterName, hidden: false },
      { merge: true }
    )
  );

  for (const course of coursesToWrite) {
    if (cancelled) break;
    // 1) Cross-term catalog doc — audit/reuse across configs.
    const catalogId = `${prefix}:${course.code}`;
    const catalogRef = catalog.doc(catalogId);
    await add(() =>
      batch.set(
        catalogRef,
        {
          ...course,
          id: catalogId,
          provider,
          termCode,
          lastUpdated: now(),
          sourceConfigId: configId,
        },
        { merge: true }
      )
    );

    // 2) Live semester-course docs — one per (course, professor). Multiple
    // sections taught by the same prof get merged into a single doc so the
    // catalog isn't fragmented per section. Matches the Excel upload doc-id
    // format (`${code} : ${instructor}`) so re-runs and re-uploads converge
    // on the same row.
    const byInstructor =
      sectionsByCourseInstructor.get(course.code) ?? new Map();
    for (const [instructorKey, sections] of byInstructor) {
      const semDocId = semesterCourseDocId(course.code, instructorKey);
      const semRef = semesterCourses.doc(semDocId);
      const semPayload = buildSemesterCourseDoc(
        course,
        sections,
        semesterName,
        configId,
        provider
      );
      await add(() => batch.set(semRef, semPayload, { merge: true }));
    }
  }

  // Also write per-section catalog rows (pure audit, independent of the
  // legacy semester layout).
  for (const section of sectionsToWrite) {
    if (cancelled) break;
    const parentId = `${prefix}:${section.courseCode}`;
    const sectionId = `${prefix}:${section.classNumber}`;
    const ref = catalog.doc(parentId).collection('sections').doc(sectionId);
    await add(() =>
      batch.set(
        ref,
        {
          ...section,
          id: sectionId,
          courseId: parentId,
          provider,
          termCode,
          lastUpdated: now(),
          sourceConfigId: configId,
        },
        { merge: true }
      )
    );
  }

  // Stale-placeholder cleanup. A course we just wrote may also have a
  // legacy `${code} : <placeholder>` doc left over from a prior run when
  // those sections had no instructor on file. For each course, we know
  // the set of class numbers that the run wrote under a *real* instructor
  // — any of those numbers that still appear in a placeholder doc are now
  // stale and get removed. The placeholder doc is deleted outright when
  // it's emptied, otherwise updated in place so any sections that still
  // have no instructor (e.g. a different section of the same course) are
  // preserved on the canonical 'TBA' doc.
  const realSectionsByCourse = new Map<string, Set<string>>();
  for (const [courseCode, byInstructor] of sectionsByCourseInstructor) {
    const realCns = new Set<string>();
    for (const [key, sections] of byInstructor) {
      if (isPlaceholderInstructor(key)) continue;
      for (const s of sections) {
        if (s.classNumber) realCns.add(s.classNumber);
      }
    }
    if (realCns.size > 0) realSectionsByCourse.set(courseCode, realCns);
  }
  // Flush the main writes first so any same-doc cleanup updates we queue
  // below see the new state; also keeps the placeholder reads consistent.
  await flush();
  for (const [courseCode, realCns] of realSectionsByCourse) {
    if (cancelled) break;
    for (const placeholder of PLACEHOLDER_INSTRUCTOR_DOC_KEYS) {
      const docId = semesterCourseDocId(courseCode, placeholder);
      const ref = semesterCourses.doc(docId);
      const snap = await ref.get();
      if (!snap.exists) continue;
      const data = snap.data() ?? {};
      const existing: string[] = Array.isArray(data.class_numbers)
        ? (data.class_numbers as unknown[]).map((v) => String(v ?? '').trim())
        : [];
      // Pre-`class_numbers` data: fall back to splitting class_number.
      if (existing.length === 0 && typeof data.class_number === 'string') {
        for (const piece of data.class_number.split(',')) {
          const p = piece.trim();
          if (p) existing.push(p);
        }
      }
      const remaining = existing.filter((cn) => !realCns.has(cn));
      if (existing.length === 0 || remaining.length === 0) {
        await add(() => batch.delete(ref));
      } else if (remaining.length < existing.length) {
        await add(() =>
          batch.set(
            ref,
            {
              class_numbers: remaining,
              class_number: remaining.join(', '),
              section_count: remaining.length,
            },
            { merge: true }
          )
        );
      }
    }
  }

  await flush();
  return { cancelled };
}

export async function runAndPersist(ctx: RunContext): Promise<RunOutcome> {
  const { db, configId, config, triggeredBy, triggeredByUid, includeCourses } =
    ctx;
  const runRef = db
    .collection('courseFetchConfigs')
    .doc(configId)
    .collection('runs')
    .doc();
  const runId = runRef.id;
  const startedAt = new Date();

  await runRef.set({
    runId,
    configId,
    startedAt: now(),
    status: 'running',
    phase: 'fetching',
    rawCount: 0,
    courseCount: 0,
    sectionCount: 0,
    errors: [],
    warnings: [],
    cancelRequested: false,
    triggeredBy,
    ...(triggeredByUid ? { triggeredByUid } : {}),
  });

  await db.collection('courseFetchConfigs').doc(configId).set(
    {
      lastRunId: runId,
      lastStatus: 'running',
      lastAttemptAt: now(),
    },
    { merge: true }
  );

  // Cooperative cancellation probe. Reads the run doc; returns true once an
  // admin has hit Cancel via cancelCourseFetchRun. One extra read per page /
  // batch is cheap at UF scale.
  const checkCancel: CancelCheck = async () => {
    try {
      const snap = await runRef.get();
      return snap.exists && snap.data()?.cancelRequested === true;
    } catch {
      return false;
    }
  };

  const snapshot = toConfigSnapshot(configId, config);
  let result: FetchResult;
  try {
    result = await fetchCoursesForConfig(snapshot, { checkCancel });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    await runRef.set(
      {
        finishedAt: now(),
        status: 'failed',
        errors: [message],
        durationMs,
      },
      { merge: true }
    );
    await db
      .collection('courseFetchConfigs')
      .doc(configId)
      .set(
        {
          lastStatus: 'failed',
          lastError: message,
          nextRefreshAt: computeNextRefreshAt(config.refresh, finishedAt),
        },
        { merge: true }
      );
    return {
      runId,
      status: 'failed',
      rawCount: 0,
      courseCount: 0,
      sectionCount: 0,
      durationMs,
      errors: [message],
      warnings: [],
    };
  }

  // If the provider loop was cancelled, skip persist entirely. No partial
  // writes, no lastSuccessAt bump; nextRefreshAt still advances so a cron
  // doesn't retry-storm on the next tick.
  let persistCancelled = false;
  if (result.status === 'cancelled' || result.cancelled) {
    // fall through to terminal block
  } else {
    await runRef.set({ phase: 'writing' }, { merge: true });
    try {
      const commitRes = await commitCoursesAndSections(
        db,
        configId,
        config.provider,
        config,
        result,
        includeCourses,
        checkCancel
      );
      persistCancelled = commitRes.cancelled;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.status = result.status === 'failed' ? 'failed' : 'partial_success';
      result.errors.push(`persist: ${message}`);
    }
  }

  const cancelled = result.status === 'cancelled' || persistCancelled;
  if (cancelled) {
    result.status = 'cancelled';
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  // Report counts of what was actually persisted — when the caller curated a
  // subset via includeCourses, the fetched totals overstate the write.
  const includeSet =
    includeCourses && includeCourses.length > 0
      ? new Set(includeCourses.map((c) => c.trim().toUpperCase()))
      : null;
  const persistedCourseCount = includeSet
    ? result.courses.filter((c) => includeSet.has(c.code.trim().toUpperCase()))
        .length
    : result.courses.length;
  const persistedSectionCount = includeSet
    ? result.sections.filter((s) =>
        includeSet.has(s.courseCode.trim().toUpperCase())
      ).length
    : result.sections.length;

  // Pull the cancelling uid off the run doc (if any) so the warning message
  // names the admin who hit Cancel. Best-effort only.
  let cancelWho: string | undefined;
  if (cancelled) {
    try {
      const snap = await runRef.get();
      const data = snap.data();
      if (typeof data?.cancelRequestedBy === 'string') {
        cancelWho = data.cancelRequestedBy;
      }
    } catch {
      // ignore
    }
    const phase = persistCancelled ? 'writing' : 'fetching';
    result.warnings.unshift(
      `run cancelled${cancelWho ? ` by ${cancelWho}` : ''} during ${phase}`
    );
  }

  await runRef.set(
    {
      finishedAt: now(),
      status: result.status,
      rawCount: result.rawCount,
      courseCount: cancelled && !persistCancelled ? 0 : persistedCourseCount,
      sectionCount: cancelled && !persistCancelled ? 0 : persistedSectionCount,
      errors: result.errors.slice(0, 50),
      warnings: result.warnings.slice(0, 50),
      durationMs,
      ...(includeSet ? { curated: true } : {}),
    },
    { merge: true }
  );

  await db
    .collection('courseFetchConfigs')
    .doc(configId)
    .set(
      {
        lastStatus: result.status,
        lastError:
          cancelled || !result.errors[0]
            ? admin.firestore.FieldValue.delete()
            : result.errors[0],
        lastSuccessAt:
          result.status === 'failed' || cancelled ? undefined : now(),
        nextRefreshAt: computeNextRefreshAt(config.refresh, finishedAt),
      },
      { merge: true }
    );

  return {
    runId,
    status: result.status,
    rawCount: result.rawCount,
    courseCount: cancelled && !persistCancelled ? 0 : persistedCourseCount,
    sectionCount: cancelled && !persistCancelled ? 0 : persistedSectionCount,
    durationMs,
    errors: result.errors,
    warnings: result.warnings,
  };
}
