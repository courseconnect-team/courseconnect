// Types for the configurable course-fetching pipeline.
//
// These are shared between the Next.js frontend and Cloud Functions via
// source duplication (the functions/ codebase has its own `tsconfig`).
// Keep this file dependency-free so the functions copy can re-import or
// re-declare the same shapes without pulling in the Next app tree.

export type ProviderId = 'UF';

export type SemesterTermLower = 'spring' | 'summer' | 'fall';

export type RefreshMode =
  | 'manual'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'everyNHours';

export type CourseLevel = 'undergraduate' | 'graduate' | 'any';

export type CourseCampus = 'main' | 'online' | 'any';

export type CourseFetchStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'partial_success'
  | 'failed';

// Admin-editable config. Source of truth is `courseFetchConfigs/{id}`.
export interface CourseFetchConfig {
  id: string;
  label: string; // short human-readable name
  provider: ProviderId;
  institution: string; // e.g. 'UF'. Kept separate from provider for future multi-tenant use.
  term: SemesterTermLower;
  year: number; // e.g. 2026
  termCode?: string; // optional explicit override; usually derived from provider

  // Filters — empty array / undefined means "no restriction".
  departments: string[]; // e.g. ['CISE', 'ECE']
  codePrefixes: string[]; // e.g. ['COP', 'EEL']
  numberMin?: number; // e.g. 3000 for junior+
  numberMax?: number;
  campus: CourseCampus;
  level: CourseLevel;

  enabled: boolean;
  refresh: {
    mode: RefreshMode;
    // Only used when mode === 'everyNHours'. 1–168 hours.
    everyHours?: number;
  };

  // Concurrency for the paginated scrape. Clamped to [1, 16] server-side.
  concurrency: number;

  // Status / observability fields written by runs.
  lastRunId?: string;
  lastStatus?: CourseFetchStatus;
  lastError?: string;
  lastSuccessAt?: FirestoreLikeTimestamp | null;
  lastAttemptAt?: FirestoreLikeTimestamp | null;
  nextRefreshAt?: FirestoreLikeTimestamp | null;

  createdAt: FirestoreLikeTimestamp;
  updatedAt: FirestoreLikeTimestamp;
  createdBy?: string; // uid
  updatedBy?: string;
}

// Per-run record. Stored at `courseFetchConfigs/{configId}/runs/{runId}`.
export interface CourseFetchRun {
  runId: string;
  configId: string;
  startedAt: FirestoreLikeTimestamp;
  finishedAt?: FirestoreLikeTimestamp | null;
  status: CourseFetchStatus;
  rawCount: number;
  courseCount: number;
  sectionCount: number;
  errors: string[];
  warnings: string[];
  durationMs?: number;
  triggeredBy: 'manual' | 'scheduled';
  triggeredByUid?: string;
}

// Normalized course in the app-facing catalog.
export interface CatalogCourse {
  id: string; // provider:termCode:code, e.g. 'UF:20261:COP3502'
  provider: ProviderId;
  institution: string;
  term: SemesterTermLower;
  year: number;
  termCode: string;
  code: string; // 'COP3502'
  codeWithSpace: string; // 'COP 3502'
  department: string; // e.g. 'CISE' (derived from prefix when possible)
  title: string;
  description?: string;
  credits?: string; // e.g. '3' or '1 TO 3'
  level?: CourseLevel;
  lastUpdated: FirestoreLikeTimestamp;
  sourceConfigId: string;
}

export interface CatalogMeetingTime {
  day: string; // e.g. 'M' or 'MWF'
  startTime?: string; // '24h HH:MM' when normalizable
  endTime?: string;
  rawTime?: string; // unnormalized fallback
  building?: string;
  room?: string;
  location?: string; // combined building+room
}

export interface CatalogSection {
  id: string; // sectionKey, e.g. 'UF:20261:12345'
  courseId: string;
  provider: ProviderId;
  term: SemesterTermLower;
  year: number;
  termCode: string;
  courseCode: string; // attached for easy querying
  classNumber: string; // e.g. '12345'
  sectionNumber?: string;
  instructors: Array<{ name: string; email?: string }>;
  meetingTimes: CatalogMeetingTime[];
  enrollmentCap?: number;
  enrolled?: number;
  waitlistCap?: number;
  waitlisted?: number;
  campus?: string;
  deliveryMode?: string;
  lastUpdated: FirestoreLikeTimestamp;
  sourceConfigId: string;
}

// --- preview (dry run) ---

export interface PreviewSection {
  classNumber: string;
  sectionNumber?: string;
  instructors: Array<{ name: string; email?: string }>;
  meetingTimes: Array<{
    day: string;
    startTime?: string;
    endTime?: string;
    rawTime?: string;
    location?: string;
    building?: string;
    room?: string;
  }>;
  enrollmentCap?: number;
  enrolled?: number;
  campus?: string;
  deliveryMode?: string;
  diffStatus: 'new' | 'updated';
}

export interface PreviewCourse {
  code: string;
  codeWithSpace: string;
  title: string;
  credits?: string;
  department?: string;
  sections: PreviewSection[];
}

export interface CoursePreview {
  status: CourseFetchStatus;
  rawCount: number;
  courseCount: number;
  sectionCount: number;
  newSectionCount: number;
  updatedSectionCount: number;
  termCode?: string;
  targetSemester: string;
  truncated: boolean;
  courses: PreviewCourse[];
  errors: string[];
  warnings: string[];
}

// --- helpers ---

// We accept either a Firestore Timestamp (when hydrated server-side) or an
// ISO string / number (when serialized to JSON for the UI). Consumers should
// normalize via `toDateOrNull` below.
export type FirestoreLikeTimestamp =
  | { toDate: () => Date }
  | { seconds: number; nanoseconds?: number }
  | string
  | number
  | Date
  | null;

export function toDateOrNull(
  value: FirestoreLikeTimestamp | undefined
): Date | null {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  if (typeof value === 'number') return new Date(value);
  if (
    typeof value === 'object' &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === 'object' && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  return null;
}

// Default config a new admin-created row starts from. Kept here so the
// UI and server agree on sensible defaults.
export const DEFAULT_COURSE_FETCH_CONFIG: Omit<
  CourseFetchConfig,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> = {
  label: 'UF — Spring (CISE)',
  provider: 'UF',
  institution: 'UF',
  term: 'spring',
  year: new Date().getFullYear(),
  departments: [],
  codePrefixes: [],
  campus: 'any',
  level: 'any',
  enabled: false,
  refresh: { mode: 'manual' },
  concurrency: 4,
};
