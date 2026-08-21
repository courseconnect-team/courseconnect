/**
 * Parser for the UF "Department View Schedule of Classes" export.
 *
 * The report is not a clean table: it opens with a title block (term name,
 * run date, several legend lines) and closes with a "Report Run Time:"
 * footer, so the real header sits somewhere in the middle of the sheet.
 * Worse, the column set drifts between exports — the Fall 2026 file added
 * four session-date columns ahead of `Course`, shifting every later column
 * right by four. The original upload path read fixed `__EMPTY_n` keys, so
 * that shift silently mapped `Course` onto `Acad Org` and so on.
 *
 * This module therefore locates the header row by content and resolves every
 * column by name (with aliases), which survives both layouts.
 *
 * Kept free of React and Firestore so `tests/unit/scheduleOfClasses.test.ts`
 * can exercise it directly.
 */

export interface ScheduleMeetingTime {
  day: string;
  time: string;
  location: string;
}

/** One merged (course, instructor) doc, ready to write under a semester. */
export interface ScheduleCourseGroup {
  docId: string;
  code: string;
  codeWithSpace: string;
  instructor: string;
  instructorEmails: string[];
  classNumbers: string[];
  sectionNumbers: string[];
  meetingTimes: ScheduleMeetingTime[];
  /** Summed across the group's distinct sections; '' when the source had none. */
  enrollmentCap: string;
  enrolled: string;
  credits: string;
  title: string;
}

export interface ScheduleParseResult {
  groups: ScheduleCourseGroup[];
  /** 0-based index of the detected header row, or -1 when none was found. */
  headerRowIndex: number;
  /** Rows below the header that carried a course code or a class number. */
  dataRowCount: number;
  /** Rows carrying one of code/class-number but not the other. */
  skippedMissingId: number;
  /** Rows whose Class Status was X (cancelled). */
  skippedCancelled: number;
  /** Required headers the sheet did not provide. Non-empty ⇒ unusable file. */
  missingColumns: string[];
}

/** Header labels we accept for each field, in priority order. */
const COLUMN_ALIASES = {
  code: ['course'],
  classNumber: ['class nbr', 'class number', 'class #'],
  section: ['sect', 'section'],
  title: ['course title', 'title'],
  instructor: ['instructor', 'instructors', 'instructor(s)'],
  emails: ['instructor emails', 'instructor email', 'instructor email(s)'],
  credits: ['min - max cred', 'min-max cred', 'credits', 'cred'],
  days: ['day/s', 'days', 'day'],
  time: ['time', 'times'],
  facility: ['facility', 'room', 'location'],
  enrollmentCap: ['enr cap', 'enrl cap', 'enrollment cap'],
  enrolled: ['enrolled', 'enrl tot', 'enrollment'],
  status: ['class status', 'status'],
} as const;

type ColumnField = keyof typeof COLUMN_ALIASES;

/** Without these two there is no stable identity for a row. */
const REQUIRED_FIELDS: ColumnField[] = ['code', 'classNumber'];

/** Human-readable names for the required-column error message. */
const FIELD_LABELS: Record<ColumnField, string> = {
  code: 'Course',
  classNumber: 'Class Nbr',
  section: 'Sect',
  title: 'Course Title',
  instructor: 'Instructor',
  emails: 'Instructor Emails',
  credits: 'Min - Max Cred',
  days: 'Day/s',
  time: 'Time',
  facility: 'Facility',
  enrollmentCap: 'Enr Cap',
  enrolled: 'Enrolled',
  status: 'Class Status',
};

function cell(row: unknown[] | undefined, index: number): string {
  if (!row || index < 0) return '';
  return String(row[index] ?? '').trim();
}

/** Header text → comparison key: lowercased, whitespace-collapsed, no trailing colon. */
function headerKey(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/:$/, '');
}

// Normalize a course code the same way the auto-fetch pipeline does
// (`functions/.../normalize.ts`): strip whitespace, uppercase. The result is
// the bare "COP3502" form used inside doc ids.
export function normalizeCode(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\s+/g, '')
    .trim()
    .toUpperCase();
}

export function addCodeSpace(code: string): string {
  const m = code.match(/^([A-Z]{2,4})(\d{3,4}[A-Z]?)$/);
  return m ? `${m[1]} ${m[2]}` : code;
}

// Names that mean "no real instructor on file" — same set the auto-fetch
// runner collapses (see `functions/src/courseFetcher/runner.ts`). All map
// to 'TBA' so a course has at most one no-instructor doc per semester.
const PLACEHOLDER_INSTRUCTOR_LOWER = new Set([
  'tba',
  'undef',
  'undefined',
  'unknown',
  '-',
]);

// Stable instructor key used in the doc id. Mirrors
// `instructorKeyFromSection` in `functions/src/courseFetcher/runner.ts`:
// trim + collapse whitespace, fall back to 'TBA' when missing or when the
// source uses a placeholder string. Keeping the two writers aligned means
// re-runs and re-uploads merge into the same doc.
export function instructorKey(raw: unknown): string {
  const cleaned = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'TBA';
  if (PLACEHOLDER_INSTRUCTOR_LOWER.has(cleaned.toLowerCase())) return 'TBA';
  return cleaned;
}

// Doc-id shape shared with auto-fetch (`runner.ts::commitCoursesAndSections`).
// One doc per (course, professor); section-level rows for the same prof get
// merged on the same doc so re-uploads (and the auto-fetch pipeline) don't
// produce duplicates.
export function semesterCourseDocId(code: string, instructor: string): string {
  // Firestore doc ids cannot contain '/'. Other punctuation (commas in
  // "Smith, John", periods, etc.) is permitted.
  const safeInstructor = instructor.replace(/\//g, '-');
  return `${code} : ${safeInstructor}`;
}

/**
 * Locate the header row: the first row that carries every required label.
 * Scans the whole sheet rather than a fixed window — the preamble length
 * varies with how many legend lines the report emits.
 */
export function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const keys = new Set((rows[i] ?? []).map(headerKey));
    const hasAll = REQUIRED_FIELDS.every((field) =>
      COLUMN_ALIASES[field].some((alias) => keys.has(alias))
    );
    if (hasAll) return i;
  }
  return -1;
}

/** Resolve each field to a column index in `headerRow`; -1 when absent. */
export function resolveColumns(
  headerRow: unknown[]
): Record<ColumnField, number> {
  const keys = (headerRow ?? []).map(headerKey);
  const out = {} as Record<ColumnField, number>;
  (Object.keys(COLUMN_ALIASES) as ColumnField[]).forEach((field) => {
    let found = -1;
    for (const alias of COLUMN_ALIASES[field]) {
      const at = keys.indexOf(alias);
      if (at !== -1) {
        found = at;
        break;
      }
    }
    out[field] = found;
  });
  return out;
}

/** Split the semicolon- (or comma-) delimited Instructor Emails cell. */
function splitEmails(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && e.toLowerCase() !== 'undef');
}

interface Accumulator extends ScheduleCourseGroup {
  /** Class numbers already counted toward cap/enrolled, so repeated meeting
   *  rows for one section don't multiply the totals. */
  countedSections: Set<string>;
  meetingKeys: Set<string>;
  capTotal: number;
  enrolledTotal: number;
  anyCap: boolean;
  anyEnrolled: boolean;
}

/**
 * Parse sheet rows (as produced by `xlsx`'s `sheet_to_json(ws, {header: 1})`)
 * into merged per-(course, instructor) groups.
 *
 * Rows are grouped by doc id; the same section appearing on several rows —
 * the report emits one row per meeting pattern — contributes its enrollment
 * numbers exactly once and its distinct meeting times once each.
 */
export function parseScheduleOfClasses(rows: unknown[][]): ScheduleParseResult {
  const headerRowIndex = findHeaderRowIndex(rows);
  if (headerRowIndex === -1) {
    return {
      groups: [],
      headerRowIndex: -1,
      dataRowCount: 0,
      skippedMissingId: 0,
      skippedCancelled: 0,
      missingColumns: REQUIRED_FIELDS.map((f) => FIELD_LABELS[f]),
    };
  }

  const columns = resolveColumns(rows[headerRowIndex]);
  const missingColumns = REQUIRED_FIELDS.filter((f) => columns[f] === -1).map(
    (f) => FIELD_LABELS[f]
  );
  if (missingColumns.length > 0) {
    return {
      groups: [],
      headerRowIndex,
      dataRowCount: 0,
      skippedMissingId: 0,
      skippedCancelled: 0,
      missingColumns,
    };
  }

  const groups = new Map<string, Accumulator>();
  let dataRowCount = 0;
  let skippedMissingId = 0;
  let skippedCancelled = 0;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const code = normalizeCode(cell(row, columns.code));
    const classNumber = cell(row, columns.classNumber);

    // Blank separators and the trailing "Report Run Time:" footer carry
    // neither identifier — drop them without counting them as problems.
    if (!code && !classNumber) continue;
    dataRowCount++;
    if (!code || !classNumber) {
      skippedMissingId++;
      continue;
    }

    // Sched-code key on the report: X = Cancelled. Cancelled sections
    // should not show up as postable courses.
    if (cell(row, columns.status).toUpperCase() === 'X') {
      skippedCancelled++;
      continue;
    }

    const instructor = instructorKey(cell(row, columns.instructor));
    const docId = semesterCourseDocId(code, instructor);

    let group = groups.get(docId);
    if (!group) {
      group = {
        docId,
        code,
        codeWithSpace: addCodeSpace(code),
        instructor,
        instructorEmails: [],
        classNumbers: [],
        sectionNumbers: [],
        meetingTimes: [],
        enrollmentCap: '',
        enrolled: '',
        credits: '',
        title: '',
        countedSections: new Set<string>(),
        meetingKeys: new Set<string>(),
        capTotal: 0,
        enrolledTotal: 0,
        anyCap: false,
        anyEnrolled: false,
      };
      groups.set(docId, group);
    }

    if (!group.classNumbers.includes(classNumber)) {
      group.classNumbers.push(classNumber);
    }
    const section = cell(row, columns.section);
    if (section && !group.sectionNumbers.includes(section)) {
      group.sectionNumbers.push(section);
    }
    for (const email of splitEmails(cell(row, columns.emails))) {
      if (!group.instructorEmails.includes(email)) {
        group.instructorEmails.push(email);
      }
    }
    if (!group.credits) group.credits = cell(row, columns.credits);
    if (!group.title) group.title = cell(row, columns.title);

    // Enrollment lives on the section, and the report repeats it on every
    // meeting row of that section — count it once per class number.
    if (!group.countedSections.has(classNumber)) {
      group.countedSections.add(classNumber);
      const cap = Number(cell(row, columns.enrollmentCap));
      const enrolled = Number(cell(row, columns.enrolled));
      if (cell(row, columns.enrollmentCap) !== '' && Number.isFinite(cap)) {
        group.capTotal += cap;
        group.anyCap = true;
      }
      if (cell(row, columns.enrolled) !== '' && Number.isFinite(enrolled)) {
        group.enrolledTotal += enrolled;
        group.anyEnrolled = true;
      }
    }

    const day = cell(row, columns.days).replace(/\s+/g, '');
    const time = cell(row, columns.time);
    const location = cell(row, columns.facility);
    // Sections of one course frequently share a lecture meeting; listing it
    // once per section would just repeat the same line in the UI.
    if (day || time || location) {
      const key = `${day}|${time}|${location}`;
      if (!group.meetingKeys.has(key)) {
        group.meetingKeys.add(key);
        group.meetingTimes.push({
          day: day || 'undef',
          time: time || 'undef',
          location: location || 'undef',
        });
      }
    }
  }

  const result: ScheduleCourseGroup[] = [];
  // Array.from rather than iterating the Map directly — the Next config
  // still targets ES5 for this bundle.
  Array.from(groups.values()).forEach((g) => {
    result.push({
      docId: g.docId,
      code: g.code,
      codeWithSpace: g.codeWithSpace,
      instructor: g.instructor,
      instructorEmails: g.instructorEmails,
      classNumbers: g.classNumbers,
      sectionNumbers: g.sectionNumbers,
      meetingTimes: g.meetingTimes,
      enrollmentCap: g.anyCap ? String(g.capTotal) : '',
      enrolled: g.anyEnrolled ? String(g.enrolledTotal) : '',
      credits: g.credits,
      title: g.title,
    });
  });

  return {
    groups: result,
    headerRowIndex,
    dataRowCount,
    skippedMissingId,
    skippedCancelled,
    missingColumns: [],
  };
}
