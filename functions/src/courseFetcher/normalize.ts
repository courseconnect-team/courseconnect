// Pure helpers for cleaning and normalizing course / section data.
// Everything here must be side-effect free so it can be unit-tested.

import type {
  FilterOptions,
  NormalizedCourse,
  NormalizedMeetingTime,
  NormalizedSection,
} from './types';

// 'COP3502' -> 'COP 3502'. Returns input unchanged if it already has a space
// or doesn't match the letters-then-digits shape.
export function addCodeSpace(code: string): string {
  const trimmed = code.trim();
  if (/\s/.test(trimmed)) return trimmed;
  const m = trimmed.match(/^([A-Z]{2,4})(\d{3,4}[A-Z]?)$/);
  if (!m) return trimmed;
  return `${m[1]} ${m[2]}`;
}

// Derive a department-ish bucket from a course code prefix when the provider
// didn't give one. e.g. 'COP3502' -> 'COP'. Returns '' when indeterminate.
export function departmentFromCode(code: string): string {
  const m = code.trim().match(/^([A-Z]{2,4})/);
  return m ? m[1] : '';
}

// 'period 3' / '3rd period' / '12:50 pm' / '1250' — UF's schedule API returns
// time in a few shapes. We try to produce 'HH:MM' 24h. Returns undefined if
// we can't normalize; callers should fall back to `rawTime`.
export function to24h(time: string | undefined | null): string | undefined {
  if (!time) return undefined;
  const s = String(time).trim();
  if (!s) return undefined;

  // Already 24h HH:MM
  const hhmm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const h = Number(hhmm[1]);
    const m = Number(hhmm[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${hhmm[2]}`;
    }
  }

  // 12h with am/pm: '12:50 pm', '1:00am'
  const twelve = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (twelve) {
    let h = Number(twelve[1]);
    const m = twelve[2] ? Number(twelve[2]) : 0;
    const suffix = twelve[3].toLowerCase();
    if (h === 12) h = 0;
    if (suffix === 'pm') h += 12;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  // 4-digit military time: '1250'
  const digits = s.match(/^(\d{3,4})$/);
  if (digits) {
    const raw = digits[1].padStart(4, '0');
    const h = Number(raw.slice(0, 2));
    const m = Number(raw.slice(2));
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  return undefined;
}

// Combine building + room into a friendly location string.
export function joinLocation(
  building: string | undefined,
  room: string | undefined
): string | undefined {
  const b = (building ?? '').trim();
  const r = (room ?? '').trim();
  if (!b && !r) return undefined;
  if (!b) return r;
  if (!r) return b;
  return `${b} ${r}`;
}

// Build a stable, sortable key for dedup and writes.
// Courses: `${provider}:${termCode}:${code}`
// Sections: `${provider}:${termCode}:${classNumber}`
export function courseKey(
  provider: string,
  termCode: string,
  code: string
): string {
  return `${provider}:${termCode}:${code.trim().toUpperCase()}`;
}
export function sectionKey(
  provider: string,
  termCode: string,
  classNumber: string
): string {
  return `${provider}:${termCode}:${classNumber.trim()}`;
}

// Apply admin-configured filters. Provider filters (e.g. department=CISE on
// the API) are a best-effort optimization; this is the authoritative cut.
export function filterCourse(
  course: NormalizedCourse,
  f: FilterOptions
): boolean {
  if (f.codePrefixes && f.codePrefixes.length > 0) {
    const prefix = departmentFromCode(course.code);
    if (!f.codePrefixes.some((p) => prefix === p.toUpperCase())) return false;
  }

  if (f.departments && f.departments.length > 0) {
    const dept = (
      course.department ?? departmentFromCode(course.code)
    ).toUpperCase();
    if (!f.departments.some((d) => dept === d.toUpperCase())) return false;
  }

  // Number range filter — pull trailing digits from the code.
  if (f.numberMin != null || f.numberMax != null) {
    const digits = course.code.match(/(\d{3,4})/);
    const num = digits ? Number(digits[1]) : NaN;
    if (!Number.isFinite(num)) return false;
    if (f.numberMin != null && num < f.numberMin) return false;
    if (f.numberMax != null && num > f.numberMax) return false;
  }

  if (f.level && f.level !== 'any' && course.level && course.level !== 'any') {
    if (course.level !== f.level) return false;
  }
  return true;
}

// Deduplicate on the stable course/section keys. Later entries replace
// earlier ones so a fresh fetch can correct stale data within a single run.
export function dedupCourses(
  provider: string,
  termCode: string,
  courses: NormalizedCourse[]
): NormalizedCourse[] {
  const map = new Map<string, NormalizedCourse>();
  for (const c of courses) {
    if (!c.code) continue;
    map.set(courseKey(provider, termCode, c.code), c);
  }
  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export function dedupSections(
  provider: string,
  termCode: string,
  sections: NormalizedSection[]
): NormalizedSection[] {
  const map = new Map<string, NormalizedSection>();
  for (const s of sections) {
    if (!s.classNumber) continue;
    map.set(sectionKey(provider, termCode, s.classNumber), s);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.courseCode === b.courseCode
      ? a.classNumber.localeCompare(b.classNumber)
      : a.courseCode.localeCompare(b.courseCode)
  );
}

export function finalizeCourse(c: NormalizedCourse): NormalizedCourse {
  const code = (c.code ?? '').trim().toUpperCase();
  return {
    ...c,
    code,
    codeWithSpace: addCodeSpace(code),
    department: (c.department ?? departmentFromCode(code)).toUpperCase(),
  };
}

export function finalizeMeetingTimes(
  times: NormalizedMeetingTime[] | undefined
): NormalizedMeetingTime[] {
  if (!Array.isArray(times)) return [];
  return times.map((t) => {
    const start = to24h(t.startTime);
    const end = to24h(t.endTime);
    return {
      day: (t.day ?? '').trim(),
      startTime: start,
      endTime: end,
      rawTime: !start && !end ? t.rawTime ?? undefined : t.rawTime,
      building: t.building,
      room: t.room,
      location: t.location ?? joinLocation(t.building, t.room),
    };
  });
}

export function finalizeSection(s: NormalizedSection): NormalizedSection {
  return {
    ...s,
    classNumber: String(s.classNumber ?? '').trim(),
    courseCode: (s.courseCode ?? '').trim().toUpperCase(),
    meetingTimes: finalizeMeetingTimes(s.meetingTimes),
    instructors: Array.isArray(s.instructors)
      ? s.instructors.map((i) => ({
          name: (i.name ?? '').trim(),
          email: i.email ? i.email.trim() : undefined,
        }))
      : [],
  };
}
