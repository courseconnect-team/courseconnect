// Provider-agnostic types used by the course-fetch pipeline.
// Provider-specific types (UF, etc.) live under ./providers.

export type ProviderId = 'UF';
export type SemesterTermLower = 'spring' | 'summer' | 'fall';
export type CourseLevel = 'undergraduate' | 'graduate' | 'any';
export type CourseCampus = 'main' | 'online' | 'any';
export type FetchStatus =
  | 'success'
  | 'partial_success'
  | 'failed'
  | 'cancelled';

// Cooperative cancellation probe. Pipeline/provider code awaits this at
// natural checkpoints (between pages, before persist, between batches) and
// bails out cleanly if it resolves true. Returning false means "keep going".
export type CancelCheck = () => Promise<boolean>;

export interface FilterOptions {
  codePrefixes?: string[];
  numberMin?: number;
  numberMax?: number;
  campus?: CourseCampus;
  level?: CourseLevel;
}

export interface ConfigSnapshot {
  id: string;
  provider: ProviderId;
  institution: string;
  term: SemesterTermLower;
  year: number;
  termCode?: string; // optional manual override
  filters: FilterOptions;
  concurrency: number;
}

// Normalized shape that every provider emits and the pipeline persists.
export interface NormalizedCourse {
  code: string; // 'COP3502'
  codeWithSpace: string; // 'COP 3502'
  title: string;
  department?: string; // short code prefix, e.g. 'COP'
  departmentName?: string; // human-readable provider name, e.g. 'Computer & Information Science & Engineering'
  description?: string;
  credits?: string;
  level?: CourseLevel;
}

export interface NormalizedMeetingTime {
  day: string;
  startTime?: string; // '24h HH:MM'
  endTime?: string;
  rawTime?: string;
  building?: string;
  room?: string;
  location?: string;
}

export interface NormalizedSection {
  classNumber: string;
  sectionNumber?: string;
  courseCode: string;
  instructors: Array<{ name: string; email?: string }>;
  meetingTimes: NormalizedMeetingTime[];
  enrollmentCap?: number;
  enrolled?: number;
  waitlistCap?: number;
  waitlisted?: number;
  campus?: string;
  deliveryMode?: string;
}

export interface FetchResult {
  status: FetchStatus;
  rawCount: number;
  courses: NormalizedCourse[];
  sections: NormalizedSection[];
  errors: string[];
  warnings: string[];
  providerMeta?: Record<string, unknown>;
  cancelled?: boolean;
}

export interface Provider {
  id: ProviderId;
  // Map a (term, year) to the provider-specific code, e.g. UF: 'fall 2026' -> '20268'
  resolveTermCode(input: { term: SemesterTermLower; year: number }): string;
  // Run the paginated fetch + normalize step. The pipeline handles filtering,
  // dedup, and persistence so providers stay focused on transport + shape.
  fetch(input: {
    config: ConfigSnapshot;
    termCode: string;
    fetcher?: Fetcher;
    checkCancel?: CancelCheck;
  }): Promise<Omit<FetchResult, 'status'> & { cancelled?: boolean }>;
}

// Abstracted so tests can inject a deterministic implementation without
// hitting the network. Production uses Node 20's global `fetch`.
export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

// Public entry point the Cloud Function calls.
export type FetchCoursesForConfig = (
  config: ConfigSnapshot,
  options?: { fetcher?: Fetcher; checkCancel?: CancelCheck }
) => Promise<FetchResult>;
