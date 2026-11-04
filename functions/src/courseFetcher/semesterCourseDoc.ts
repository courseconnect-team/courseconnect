// The live `semesters/{name}/courses/{id}` layout shared with the Excel
// upload flow: semester naming, doc ids, and the doc payload itself.

import { emailsToUsernames } from '../email';
import { now } from './firestoreBatch';
import type { ValidatedConfig } from './validation';
import type {
  NormalizedCourse,
  NormalizedMeetingTime,
  NormalizedSection,
} from './types';

// Map a config's (term, year) to the semester doc name the app uses
// everywhere else. The existing collection is `semesters/{name}/courses/*`
// with names like 'Spring 2026' / 'Fall 2026', so we match that casing.
export function semesterNameFromConfig(
  term: ValidatedConfig['term'],
  year: number
): string {
  const cap = term.charAt(0).toUpperCase() + term.slice(1);
  return `${cap} ${year}`;
}

// Doc id used by the live semester layout. Matches the Excel upload format
// (`UploadPanel.tsx`) so re-runs and re-uploads merge into the same doc.
export function semesterCourseDocId(
  code: string,
  instructorKey: string
): string {
  // Firestore doc ids cannot contain '/'. Other punctuation in instructor
  // names (commas, periods) is fine.
  const safeInstructor = instructorKey.replace(/\//g, '-');
  return `${code} : ${safeInstructor}`;
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
export function buildSemesterCourseDoc(
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
    updated_at: now(),
  };
}
