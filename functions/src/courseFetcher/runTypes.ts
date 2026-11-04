// Types for a persisted fetch run (runner + persist step). Kept apart from
// ./types so the provider/pipeline types stay free of Firestore.

import type { ValidatedConfig } from './validation';
import type { FetchResult, NormalizedSection } from './types';

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

// courseCode -> instructorKey -> that prof's sections of the course.
export type SectionsByCourseInstructor = Map<
  string,
  Map<string, NormalizedSection[]>
>;

// One live semester-course doc about to be written.
export interface SemesterCourseEntry {
  ref: FirebaseFirestore.DocumentReference;
  instructorKey: string;
  sections: NormalizedSection[];
}
