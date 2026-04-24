// UF (University of Florida) provider for the course-fetch pipeline.
//
// Source: ONE.UF schedule API at `https://one.uf.edu/apix/soc/schedule/`.
// This mirrors the logic of the original UFCourseGrabber.py reference
// implementation — specifically:
//   - `category=RES` and `term=<code>` query parameters
//   - Pagination by stride: each parallel worker walks
//     `last-control-number = 50*i, 50*i + 50*N, 50*i + 100*N, ...` where N
//     is the total concurrency. A worker stops when its response reports
//     `RETRIEVEDROWS == 0`.
//   - No provider-level department/prefix filter — ONE.UF's endpoint does
//     not expose those, so filtering happens in the pipeline after
//     normalization.
//
// Security note: the endpoint is intended to be callable without personal
// session cookies. If a deployment environment requires a cookie, it is
// read from `process.env.ONE_UF_COOKIE` at runtime only — never hardcoded.

import type {
  ConfigSnapshot,
  Fetcher,
  NormalizedCourse,
  NormalizedMeetingTime,
  NormalizedSection,
  Provider,
  SemesterTermLower,
} from '../types';

const ONE_UF_BASE = 'https://one.uf.edu/apix/soc/schedule/';
const PAGE_SIZE = 50; // ONE.UF returns up to 50 courses per last-control-number.

// UF term codes: "2" + YY + termDigit. termDigit: spring=1, summer=5, fall=8.
// Matches UFCourseGrabber.py's `term_dict`.
const UF_TERM_DIGIT: Record<SemesterTermLower, string> = {
  spring: '1',
  summer: '5',
  fall: '8',
};

export function ufTermCode(input: {
  term: SemesterTermLower;
  year: number;
}): string {
  const digit = UF_TERM_DIGIT[input.term];
  if (!digit) throw new Error(`Unsupported term: ${input.term}`);
  const yy = String(input.year).slice(-2).padStart(2, '0');
  return `2${yy}${digit}`;
}

// Defensive accessor — never throws on missing keys.
function pick(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  return (obj as Record<string, unknown>)[key];
}
function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}
function num(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function buildUrl(termCode: string, lastControlNumber: number): string {
  const params = new URLSearchParams();
  params.set('category', 'RES');
  params.set('term', termCode);
  params.set('last-control-number', String(lastControlNumber));
  return `${ONE_UF_BASE}?${params.toString()}`;
}

function defaultHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent':
      'CourseConnect-Scraper/1.0 (+https://courseconnect.eng.ufl.edu)',
  };
  const cookie = process.env.ONE_UF_COOKIE;
  if (cookie && cookie.trim()) {
    h.Cookie = cookie.trim();
  }
  return h;
}

async function fetchWithRetry(
  url: string,
  fetcher: Fetcher,
  attempts = 3
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetcher(url, {
        method: 'GET',
        headers: defaultHeaders(),
      });
      if (res.ok) return res;
      // Retry on 5xx / 429 only. 4xx other than 429 is a config problem —
      // bail immediately instead of burning retries.
      if (res.status !== 429 && res.status < 500) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      lastErr = new Error(`HTTP ${res.status} ${res.statusText}`);
    } catch (err) {
      // Non-retryable HTTP errors rethrown from above reach here too; those
      // come in as `Error` with an `HTTP 4xx` message, which we surface
      // immediately without further retries.
      const message = err instanceof Error ? err.message : String(err);
      if (/^HTTP [34]\d\d/.test(message) && !/^HTTP 429/.test(message)) {
        throw err;
      }
      lastErr = err;
    }
    // Exponential backoff with jitter: 250ms, 750ms, 1750ms.
    const delay = 250 * 2 ** i + Math.floor(Math.random() * 150);
    await new Promise((r) => setTimeout(r, delay));
  }
  throw lastErr instanceof Error ? lastErr : new Error('fetch failed');
}

type UFPage = {
  rawCourses: unknown[];
  retrievedRows: number; // ONE.UF's RETRIEVEDROWS — 0 means "no more data".
};

async function fetchPage(url: string, fetcher: Fetcher): Promise<UFPage> {
  const res = await fetchWithRetry(url, fetcher);
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('ONE.UF returned non-JSON response');
  }

  // Response shape: [ { COURSES: [...], LASTCONTROLNUMBER, TOTALROWS, RETRIEVEDROWS } ]
  const root = Array.isArray(parsed) ? parsed[0] : parsed;
  const coursesField = pick(root, 'COURSES');
  const rawCourses = Array.isArray(coursesField) ? coursesField : [];
  const retrievedRows = num(pick(root, 'RETRIEVEDROWS')) ?? rawCourses.length;
  return { rawCourses, retrievedRows };
}

// Very defensive: any field can be missing. We never throw on shape.
function normalizeCourseRow(row: unknown): {
  course: NormalizedCourse | null;
  sections: NormalizedSection[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const code = str(pick(row, 'code')) ?? str(pick(row, 'courseCode')) ?? '';
  if (!code) {
    return {
      course: null,
      sections: [],
      warnings: ['row missing course code'],
    };
  }
  const title = str(pick(row, 'name')) ?? str(pick(row, 'title')) ?? code;
  const description = str(pick(row, 'description'));
  const credits =
    str(pick(row, 'openCredits')) ?? str(pick(row, 'credits')) ?? undefined;

  // ONE.UF does not place deptName on the course row — it lives on each
  // section. All sections of a course share the same department, so the
  // first section's deptName is authoritative for the course.
  const rawSectionsForDept = pick(row, 'sections');
  const firstSection = Array.isArray(rawSectionsForDept)
    ? rawSectionsForDept[0]
    : undefined;
  const departmentName =
    str(pick(row, 'deptName')) ??
    str(pick(row, 'department')) ??
    str(pick(firstSection, 'deptName'));

  const course: NormalizedCourse = {
    code,
    codeWithSpace: code, // finalize() will inject the space
    title,
    description,
    credits,
    departmentName,
  };

  const rawSections = pick(row, 'sections');
  const sections: NormalizedSection[] = Array.isArray(rawSections)
    ? rawSections
        .map((raw) => normalizeSectionRow(code, raw, warnings))
        .filter((s): s is NormalizedSection => s !== null)
    : [];
  return { course, sections, warnings };
}

function normalizeSectionRow(
  courseCode: string,
  raw: unknown,
  warnings: string[]
): NormalizedSection | null {
  const classNumber =
    str(pick(raw, 'classNumber')) ?? str(pick(raw, 'classNbr')) ?? '';
  if (!classNumber) {
    warnings.push(`section under ${courseCode} missing classNumber`);
    return null;
  }

  const sectionNumber =
    str(pick(raw, 'number')) ?? str(pick(raw, 'sectionNumber'));

  const instructors = (() => {
    const list = pick(raw, 'instructors');
    if (!Array.isArray(list)) return [];
    return list
      .map((i) => ({
        name: str(pick(i, 'name')) ?? '',
        email: str(pick(i, 'email')),
      }))
      .filter((i) => i.name);
  })();

  const meetingTimes: NormalizedMeetingTime[] = (() => {
    const list = pick(raw, 'meetTimes');
    if (!Array.isArray(list)) return [];
    const out: NormalizedMeetingTime[] = [];
    for (const m of list) {
      const days = pick(m, 'meetDays');
      const daysArr = Array.isArray(days)
        ? days.map((d) => String(d))
        : [String(days ?? '')];
      const dayStr = daysArr.filter(Boolean).join('');
      const start = str(pick(m, 'meetTimeBegin')) ?? str(pick(m, 'startTime'));
      const end = str(pick(m, 'meetTimeEnd')) ?? str(pick(m, 'endTime'));
      const building = str(pick(m, 'meetBuilding')) ?? str(pick(m, 'building'));
      const room = str(pick(m, 'meetRoom')) ?? str(pick(m, 'room'));
      out.push({
        day: dayStr,
        startTime: start,
        endTime: end,
        rawTime:
          !start && !end
            ? str(pick(m, 'meetPeriodBegin')) ?? str(pick(m, 'rawTime'))
            : undefined,
        building,
        room,
      });
    }
    return out;
  })();

  return {
    classNumber,
    sectionNumber,
    courseCode,
    instructors,
    meetingTimes,
    enrollmentCap:
      num(pick(raw, 'enrollmentCap')) ?? num(pick(raw, 'classCapacity')),
    enrolled: num(pick(raw, 'enrolled')) ?? num(pick(raw, 'enrollment')),
    waitlistCap: num(pick(raw, 'waitListCap')),
    waitlisted: num(pick(raw, 'waitListed')),
    campus: str(pick(raw, 'campus')),
    deliveryMode:
      str(pick(raw, 'instructionMethod')) ?? str(pick(raw, 'deliveryMode')),
  };
}

// One worker walks last-control-number = start, start+stride, start+2*stride, ...
// stopping when its response reports RETRIEVEDROWS == 0. Each worker records
// errors independently so a single shard failing does not abort the run.
async function walkStride(params: {
  termCode: string;
  start: number;
  stride: number;
  fetcher: Fetcher;
}): Promise<{ rawCourses: unknown[]; errors: string[] }> {
  const { termCode, start, stride, fetcher } = params;
  const rawCourses: unknown[] = [];
  const errors: string[] = [];
  let last = start;
  // Safety cap: 400 * stride ~= 20k control numbers per worker, far above
  // any real term size. Prevents infinite loops on provider bugs.
  for (let i = 0; i < 400; i++) {
    const url = buildUrl(termCode, last);
    let page: UFPage;
    try {
      page = await fetchPage(url, fetcher);
    } catch (err) {
      errors.push(
        `worker(start=${start}, last=${last}): ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      break;
    }
    if (page.retrievedRows === 0) break;
    if (page.rawCourses.length > 0) rawCourses.push(...page.rawCourses);
    last += stride;
  }
  return { rawCourses, errors };
}

export const ufProvider: Provider = {
  id: 'UF',
  resolveTermCode: ufTermCode,
  async fetch({ config, termCode, fetcher }) {
    const use = fetcher ?? (globalThis.fetch as Fetcher);
    const warnings: string[] = [];
    const errors: string[] = [];
    const normalizedCourses: NormalizedCourse[] = [];
    const normalizedSections: NormalizedSection[] = [];

    // Stride-parallel walk matching UFCourseGrabber.py. Workers are
    // independent — if one errors, others keep going. Filters are applied
    // later by the pipeline since the ONE.UF endpoint doesn't support
    // department/prefix parameters.
    const workerCount = Math.max(1, Math.min(config.concurrency, 16));
    const stride = PAGE_SIZE * workerCount;
    const workers: Array<Promise<{ rawCourses: unknown[]; errors: string[] }>> =
      [];
    for (let i = 0; i < workerCount; i++) {
      workers.push(
        walkStride({
          termCode,
          start: PAGE_SIZE * i,
          stride,
          fetcher: use,
        })
      );
    }
    const results = await Promise.all(workers);
    for (const r of results) {
      if (r.errors.length) errors.push(...r.errors);
      for (const row of r.rawCourses) {
        const {
          course,
          sections,
          warnings: rowWarnings,
        } = normalizeCourseRow(row);
        if (rowWarnings.length) warnings.push(...rowWarnings);
        if (course) normalizedCourses.push(course);
        for (const s of sections) normalizedSections.push(s);
      }
    }

    return {
      rawCount: normalizedCourses.length,
      courses: normalizedCourses,
      sections: normalizedSections,
      errors,
      warnings,
    };
  },
};
