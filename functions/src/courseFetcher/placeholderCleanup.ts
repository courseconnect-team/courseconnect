// Stale-placeholder cleanup. A course we just wrote may also have a legacy
// `${code} : <placeholder>` doc left over from a prior run when those
// sections had no instructor on file. For each course, we know the set of
// class numbers that the run wrote under a *real* instructor — any of those
// numbers that still appear in a placeholder doc are now stale and get
// removed. The placeholder doc is deleted outright when it's emptied,
// otherwise updated in place so any sections that still have no instructor
// (e.g. a different section of the same course) are preserved on the
// canonical 'TBA' doc.

import type { BatchWriter } from './firestoreBatch';
import {
  isPlaceholderInstructor,
  PLACEHOLDER_INSTRUCTOR_DOC_KEYS,
} from './instructors';
import type { SectionsByCourseInstructor } from './runTypes';
import { semesterCourseDocId } from './semesterCourseDoc';

// courseCode -> class numbers this run wrote under a real instructor.
function realClassNumbersByCourse(
  grouped: SectionsByCourseInstructor
): Map<string, Set<string>> {
  const realSectionsByCourse = new Map<string, Set<string>>();
  for (const [courseCode, byInstructor] of grouped) {
    const realCns = new Set<string>();
    for (const [key, sections] of byInstructor) {
      if (isPlaceholderInstructor(key)) continue;
      for (const s of sections) {
        if (s.classNumber) realCns.add(s.classNumber);
      }
    }
    if (realCns.size > 0) realSectionsByCourse.set(courseCode, realCns);
  }
  return realSectionsByCourse;
}

function classNumbersOf(data: FirebaseFirestore.DocumentData): string[] {
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
  return existing;
}

// Expects the run's main writes to already be flushed, so the placeholder
// reads see the new state.
export async function cleanUpStalePlaceholders(
  semesterCourses: FirebaseFirestore.CollectionReference,
  grouped: SectionsByCourseInstructor,
  writer: BatchWriter
): Promise<void> {
  for (const [courseCode, realCns] of realClassNumbersByCourse(grouped)) {
    if (writer.cancelled) break;
    for (const placeholder of PLACEHOLDER_INSTRUCTOR_DOC_KEYS) {
      const docId = semesterCourseDocId(courseCode, placeholder);
      const ref = semesterCourses.doc(docId);
      const snap = await ref.get();
      if (!snap.exists) continue;
      const existing = classNumbersOf(snap.data() ?? {});
      const remaining = existing.filter((cn) => !realCns.has(cn));
      if (existing.length === 0 || remaining.length === 0) {
        await writer.add((batch) => batch.delete(ref));
      } else if (remaining.length < existing.length) {
        await writer.add((batch) =>
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
}
