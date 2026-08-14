/**
 * Grouping assignments by semester for the admin filter.
 *
 * The stored semester value is hand-entered and inconsistent ("Fall 2026",
 * "Fall2026"), so options are keyed on the canonical parse rather than the raw
 * string — otherwise the same semester shows up as two entries and an export
 * filtered to one of them silently omits the other.
 */
import { parseSemesterField } from './onbaseExport';

/** Sentinel for "no filter". */
export const ALL_SEMESTERS = '__all__';

/**
 * Bucket for rows whose semester can't be parsed. They get their own option so
 * they stay reachable — a row that can't be filed under any semester would
 * otherwise be invisible the moment a filter is applied.
 */
export const UNSPECIFIED_SEMESTER = '__unspecified__';

export interface SemesterOption {
  /** Filter value: a canonical "Fall 2026", or one of the sentinels. */
  value: string;
  label: string;
  count: number;
}

export interface SemesterBearing {
  semesters?: string[] | string;
}

const TERM_ORDER: Record<string, number> = { spring: 1, summer: 2, fall: 3 };

/**
 * The canonical "Fall 2026" key for an assignment, or UNSPECIFIED_SEMESTER when
 * the term and year can't both be read.
 */
export function semesterKey(row: SemesterBearing): string {
  const { semester, year, ok } = parseSemesterField(row.semesters);
  return ok ? `${semester} ${year}` : UNSPECIFIED_SEMESTER;
}

/** Newest first: year descending, then Fall > Summer > Spring within a year. */
function compareKeys(a: string, b: string): number {
  const pa = parseSemesterField(a);
  const pb = parseSemesterField(b);

  const yearDiff = Number(pb.year || 0) - Number(pa.year || 0);
  if (yearDiff) return yearDiff;

  const base = (s: string) => s.split(' ')[0].toLowerCase();
  const termDiff =
    (TERM_ORDER[base(pb.semester)] ?? 0) - (TERM_ORDER[base(pa.semester)] ?? 0);
  if (termDiff) return termDiff;

  // Summer A/B/C — later session first, to match the year/term ordering.
  return pb.semester.localeCompare(pa.semester);
}

/**
 * Build the dropdown options from the rows actually present, so the filter can
 * never offer a semester with nothing behind it. Always leads with "All
 * semesters"; appends the unspecified bucket only when such rows exist.
 */
export function buildSemesterOptions(
  rows: SemesterBearing[]
): SemesterOption[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = semesterKey(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const unspecified = counts.get(UNSPECIFIED_SEMESTER) ?? 0;
  counts.delete(UNSPECIFIED_SEMESTER);

  const options: SemesterOption[] = [
    { value: ALL_SEMESTERS, label: 'All semesters', count: rows.length },
  ];

  Array.from(counts.keys())
    .sort(compareKeys)
    .forEach((key) => {
      options.push({ value: key, label: key, count: counts.get(key) ?? 0 });
    });

  if (unspecified) {
    options.push({
      value: UNSPECIFIED_SEMESTER,
      label: 'No semester set',
      count: unspecified,
    });
  }

  return options;
}

/** Whether a row belongs in the current filter. */
export function matchesSemester(row: SemesterBearing, filter: string): boolean {
  if (!filter || filter === ALL_SEMESTERS) return true;
  return semesterKey(row) === filter;
}

export function filterBySemester<T extends SemesterBearing>(
  rows: T[],
  filter: string
): T[] {
  if (!filter || filter === ALL_SEMESTERS) return rows;
  return rows.filter((r) => matchesSemester(r, filter));
}

/** "Fall 2026" -> "fall-2026", for use in an export filename. */
export function semesterFilenameSlug(filter: string): string {
  if (!filter || filter === ALL_SEMESTERS) return 'all';
  if (filter === UNSPECIFIED_SEMESTER) return 'no-semester';
  return filter.replace(/\s+/g, '-').toLowerCase();
}
