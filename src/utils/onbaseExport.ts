/**
 * OnBase import schema.
 *
 * OnBase rejects the file unless the header row matches this list exactly —
 * same names, same order, no extras. Keep this array as the single source of
 * truth: the writer, the tests, and the sample generator all read from it.
 * Do not reorder to match the on-screen table; the table is free to change.
 *
 * Confirmed against the field list from Jen Rickerson (OnBase admin), 7/29/26.
 *
 * 'Timestamp' is appended past the confirmed 33: it is the assignment's
 * submission date, requested for the exported sheets. It is not part of the
 * OnBase field list, so it stays last — an importer that reads the columns
 * positionally still sees the 33 it expects in the order it expects them.
 */
export const ONBASE_COLUMNS = [
  'Student UFID',
  'First Name',
  'Last Name',
  'Email',
  'Supervisor UFID',
  'Supervisor First',
  'Supervisor Last',
  'Supervisor Email',
  'Proxy UFID',
  'Proxy First',
  'Proxy Last',
  'Proxy Email',
  'Requested Action',
  'Position Type',
  'Degree Type',
  'Semester',
  'Year',
  'Starting Date',
  'End Date',
  'Project ID',
  'Project Name',
  'Percentage',
  'Hours',
  'Annual Rate',
  'Biweekly Rate',
  'Hourly Rate',
  'Target Amount',
  'Working Title',
  'Duties',
  'FTE',
  'Imported',
  'Remote',
  'ECE - Special Instructions',
  'Timestamp',
] as const;

export type OnBaseColumn = (typeof ONBASE_COLUMNS)[number];
export type OnBaseRow = Record<OnBaseColumn, string | number>;

/**
 * Fields OnBase does not accept. Kept for documentation only — the writer works
 * off ONBASE_COLUMNS, so anything not listed there is dropped by construction.
 */
export const DROPPED_COLUMNS = ['Course', 'ECE - Payroll Notes'] as const;

/** Constants the department fills in the same way on every row. */
const PROXY_FIRST = 'Christophe';
const PROXY_LAST = 'Bobda';
const PROXY_EMAIL = 'cbobda@ufl.edu';
const PROJECT_NAME = 'DEPARTMENT TA / UPIS';
const DEFAULT_POSITION_TYPE = 'TA';
const DEFAULT_REQUESTED_ACTION = 'NEW HIRE';

/** Hours-per-week that counts as 1.0 FTE, per the payroll conversion. */
const FTE_HOURS_DIVISOR = 1.029411;
const FTE_FULL_TIME_HOURS = 40;

/**
 * Shape the writer needs from an assignment. Declared structurally so the
 * component can pass its enriched row and a script can pass a fixture.
 */
export interface OnBaseAssignment {
  ufid?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  supervisor_ufid?: string;
  supervisorFirst?: string;
  supervisorLast?: string;
  supervisorEmail?: string;
  proxyUfid?: string;
  requested_action?: string;
  position?: string;
  degree?: string;
  semesters?: string[] | string;
  start_date?: string;
  end_date?: string;
  pid?: string;
  percentage?: string;
  hours?: number[] | number;
  annual_rate?: string;
  biweekly_rate?: string;
  hr?: number | string;
  target_amount?: string;
  title?: string;
  class_codes?: string;
  remote?: string;
  ece_special_instructions?: string;
  /** Submission date, stored as MM-DD-YYYY — the grid's "Timestamp" column. */
  date?: string;
}

export type SemesterParseReason =
  | 'ok'
  | 'missing'
  | 'unrecognized-term'
  | 'missing-year';

export interface ParsedSemester {
  /** Canonical term, e.g. "Fall" or "Summer C". Empty when unparseable. */
  semester: string;
  /** Four-digit year. Empty when absent — never guessed. */
  year: string;
  /** False when either half could not be read off the source value. */
  ok: boolean;
  reason: SemesterParseReason;
  /** The value we tried to parse, for error reporting. */
  raw: string;
}

/** Only 19xx/20xx are accepted; a bare "26" is ambiguous and stays empty. */
const YEAR_RE = /(?:^|[^0-9])((?:19|20)\d{2})(?:[^0-9]|$)/;
const TERM_RE = /(spring|summer|fall)\s*([abc])?\b/i;

/**
 * Split a stored semester value into its term and year halves.
 *
 * OnBase wants them in separate columns, but we store them combined and the
 * combined value is hand-entered in places, so it arrives dirty. Handles
 * "Fall 2026", "Fall2026", runs of whitespace, "Summer C 2026", and reversed
 * "2026 Fall".
 *
 * A half that cannot be read comes back empty with ok=false rather than a
 * guess — a wrong year silently lands a student in the wrong appointment.
 */
export function parseSemesterField(
  value: string[] | string | undefined | null
): ParsedSemester {
  const first = Array.isArray(value)
    ? value.find((v) => typeof v === 'string' && v.trim())
    : value;

  if (typeof first !== 'string' || !first.trim()) {
    return { semester: '', year: '', ok: false, reason: 'missing', raw: '' };
  }

  const raw = first.trim().replace(/\s+/g, ' ');

  const yearMatch = raw.match(YEAR_RE);
  const year = yearMatch ? yearMatch[1] : '';

  // Strip the year before reading the term so digits can't confuse the match.
  const termSource = yearMatch ? raw.replace(yearMatch[1], ' ') : raw;
  const termMatch = termSource.match(TERM_RE);

  if (!termMatch) {
    return { semester: '', year, ok: false, reason: 'unrecognized-term', raw };
  }

  const term =
    termMatch[1].charAt(0).toUpperCase() + termMatch[1].slice(1).toLowerCase();
  const suffix = termMatch[2] ? ` ${termMatch[2].toUpperCase()}` : '';
  const semester = `${term}${suffix}`;

  if (!year) {
    return { semester, year: '', ok: false, reason: 'missing-year', raw };
  }

  return { semester, year, ok: true, reason: 'ok', raw };
}

function firstHours(hours: OnBaseAssignment['hours']): number | '' {
  const h = Array.isArray(hours) ? hours[0] : hours;
  return typeof h === 'number' ? h : '';
}

function computeFte(hours: OnBaseAssignment['hours']): number | '' {
  const h = firstHours(hours);
  if (typeof h !== 'number') return '';
  return Math.floor((h / FTE_HOURS_DIVISOR / FTE_FULL_TIME_HOURS) * 100) / 100;
}

/** Names on the assignment are stored as one string; OnBase wants them split. */
function splitName(a: OnBaseAssignment): { first: string; last: string } {
  if (a.firstName || a.lastName) {
    return { first: (a.firstName ?? '').trim(), last: (a.lastName ?? '').trim() };
  }
  const [first = '', ...rest] = (a.name ?? '').trim().split(/\s+/);
  return { first, last: rest.join(' ') };
}

/**
 * Build one OnBase row. Every key in ONBASE_COLUMNS is written, so a row can
 * never be short a field even when the assignment is sparse.
 */
export function buildOnBaseRow(a: OnBaseAssignment): OnBaseRow {
  const { first, last } = splitName(a);
  const { semester, year } = parseSemesterField(a.semesters);

  return {
    'Student UFID': a.ufid ?? '',
    'First Name': first,
    'Last Name': last,
    Email: a.email ?? '',
    'Supervisor UFID': a.supervisor_ufid ?? '',
    'Supervisor First': a.supervisorFirst ?? '',
    'Supervisor Last': a.supervisorLast ?? '',
    'Supervisor Email': a.supervisorEmail ?? '',
    'Proxy UFID': a.proxyUfid ?? '',
    'Proxy First': PROXY_FIRST,
    'Proxy Last': PROXY_LAST,
    'Proxy Email': PROXY_EMAIL,
    'Requested Action': a.requested_action || DEFAULT_REQUESTED_ACTION,
    'Position Type': a.position || DEFAULT_POSITION_TYPE,
    'Degree Type': a.degree ?? '',
    Semester: semester,
    Year: year,
    'Starting Date': a.start_date ?? '',
    'End Date': a.end_date ?? '',
    'Project ID': a.pid ?? '',
    'Project Name': PROJECT_NAME,
    Percentage: a.percentage ?? '',
    Hours: firstHours(a.hours),
    'Annual Rate': a.annual_rate ?? '',
    'Biweekly Rate': a.biweekly_rate ?? '',
    'Hourly Rate': a.hr ?? '',
    'Target Amount': a.target_amount ?? '',
    'Working Title': a.title ?? '',
    Duties: `UPI in ${String(a.class_codes ?? '').replace(/,/g, ' ')}`,
    FTE: computeFte(a.hours),
    Imported: 'YES',
    Remote: a.remote ?? 'No',
    'ECE - Special Instructions': a.ece_special_instructions ?? '',
    Timestamp: a.date ?? '',
  };
}

export function buildOnBaseRows(assignments: OnBaseAssignment[]): OnBaseRow[] {
  return assignments.map(buildOnBaseRow);
}

export interface SemesterWarning {
  ufid: string;
  name: string;
  raw: string;
  reason: SemesterParseReason;
}

/**
 * Rows whose semester could not be fully parsed. Surface these before sending
 * so a blank Semester/Year is a decision rather than a surprise on OnBase's end.
 */
export function collectSemesterWarnings(
  assignments: OnBaseAssignment[]
): SemesterWarning[] {
  return assignments.reduce<SemesterWarning[]>((acc, a) => {
    const parsed = parseSemesterField(a.semesters);
    if (!parsed.ok) {
      acc.push({
        ufid: a.ufid ?? '',
        name: a.name ?? `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim(),
        raw: parsed.raw,
        reason: parsed.reason,
      });
    }
    return acc;
  }, []);
}

function escapeCsv(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV in the OnBase column order, header row included. */
export function toOnBaseCsv(rows: OnBaseRow[]): string {
  const head = ONBASE_COLUMNS.map(escapeCsv).join(',');
  const body = rows
    .map((r) => ONBASE_COLUMNS.map((c) => escapeCsv(r[c])).join(','))
    .join('\n');
  return rows.length ? `${head}\n${body}` : head;
}
