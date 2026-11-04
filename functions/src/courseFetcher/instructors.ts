// Instructor identity for semester-course docs: placeholder detection, the
// per-doc instructor key, and grouping sections by (course, instructor).

import type { NormalizedSection } from './types';
import type { SectionsByCourseInstructor } from './runTypes';

// Names that mean "no real instructor on file". Provider data and old Excel
// rosters use a mix of these — we collapse them all onto 'TBA' so a course
// has at most one no-instructor doc, and so the run cleanup can find every
// legacy placeholder shape under a known set of doc ids.
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
export const PLACEHOLDER_INSTRUCTOR_DOC_KEYS = [
  'TBA',
  'undef',
  'undefined',
  'unknown',
  '-',
];

export function isPlaceholderInstructor(key: string): boolean {
  return PLACEHOLDER_INSTRUCTOR_LOWER.has(key.toLowerCase());
}

// Stable instructor key used for both the doc id and section grouping. We
// normalize the joined name string so two sections of the same course taught
// by the same prof land on the same doc — auto-fetch's normalize step keeps
// names consistent within a single run, so a trim/whitespace-collapse is
// enough. Falls back to 'TBA' when a section has no listed instructor or
// when the source data uses a placeholder string ('undef', '-', etc.); see
// PLACEHOLDER_INSTRUCTOR_LOWER.
export function instructorKeyFromSection(section: NormalizedSection): string {
  const joined = section.instructors
    .map((i) => (i.name ?? '').trim())
    .filter(Boolean)
    .join(', ');
  const cleaned = joined.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'TBA';
  if (isPlaceholderInstructor(cleaned)) return 'TBA';
  return cleaned;
}

// Group sections by (courseCode, instructorKey) so we emit one merged
// semester-course doc per (course, professor) pair instead of one per
// section. Inner map keys on the instructor key so a 4-section course
// taught by 2 profs produces 2 docs (one per prof, with that prof's
// sections merged), not 4.
export function groupSectionsByCourseInstructor(
  sections: NormalizedSection[]
): SectionsByCourseInstructor {
  const grouped: SectionsByCourseInstructor = new Map();
  for (const section of sections) {
    const courseKey = section.courseCode;
    const instructorKey = instructorKeyFromSection(section);
    let byInstructor = grouped.get(courseKey);
    if (!byInstructor) {
      byInstructor = new Map();
      grouped.set(courseKey, byInstructor);
    }
    const bucket = byInstructor.get(instructorKey);
    if (bucket) bucket.push(section);
    else byInstructor.set(instructorKey, [section]);
  }
  return grouped;
}
