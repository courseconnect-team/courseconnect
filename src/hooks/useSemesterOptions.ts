import { useMemo } from 'react';
import firebase from '@/firebase/firebase_config';

export type SemesterTerm = 'Spring' | 'Summer' | 'Fall';
export type SemesterName = `${SemesterTerm} ${number}`;

export const TERM_CODE: Record<SemesterTerm, number> = {
  Spring: 1,
  Summer: 2,
  Fall: 3,
};

export const getCurrentSemester = (): SemesterName => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const term: SemesterTerm =
    month < 5 ? 'Spring' : month < 8 ? 'Summer' : 'Fall';

  return `${term} ${year}` as SemesterName;
};

export function generateSemesters(startYear = 2023): SemesterName[] {
  const current = getCurrentSemester();
  const [currentTerm, currentYearStr] = current.split(' ') as [
    SemesterTerm,
    string
  ];
  const currentYear = Number(currentYearStr);

  const out: SemesterName[] = [];

  for (let y = startYear; y <= currentYear; y++) {
    out.push(`Spring ${y}`, `Summer ${y}`, `Fall ${y}`);
  }

  const currentIndex = out.findIndex(
    (s) => s === (`${currentTerm} ${currentYear}` as SemesterName)
  );

  if (currentIndex === -1) return out.reverse();

  return out.slice(0, currentIndex + 1).reverse();
}

const nextSemester = (semester: SemesterName): SemesterName => {
  const [term, yearStr] = semester.split(' ') as [SemesterTerm, string];
  const year = Number(yearStr);

  if (term === 'Spring') return `Summer ${year}` as SemesterName;
  if (term === 'Summer') return `Fall ${year}` as SemesterName;
  return `Spring ${year + 1}` as SemesterName;
};

const generateSemesterNames = (
  start: SemesterName,
  count: number
): SemesterName[] => {
  const result: SemesterName[] = [];
  let curr = start;

  for (let i = 0; i < count; i++) {
    result.push(curr);
    curr = nextSemester(curr);
  }

  return result;
};

export function useSemesters(listLength = 3) {
  const current = useMemo(getCurrentSemester, []);
  const options = useMemo(
    () => generateSemesterNames(current, listLength),
    [current, listLength]
  );

  return {
    options,
    currentSemester: current,
  };
}

export async function fetchSemesterIds(): Promise<string[]> {
  const snap = await firebase.firestore().collection('semesters').get();
  return snap.docs.map((doc) => doc.id);
}

export async function fetchClosestSemesters(
  n: number
): Promise<SemesterName[]> {
  const current = getCurrentSemester();
  return generateSemesterNames(current, n);
}

export type CourseOption = {
  code: string;
  instructor: string;
  department: string;
  semester: string;
  value: string;
  name: string;
};

// Input for the course picker. Fields come straight from the semester's course
// doc (`semesters/{sem}/courses/{id}`) — previously we reconstructed them by
// splitting the doc id on ":" but the doc id is now `${code}__{classNumber}`
// (shared with auto-fetch), so structured fields are authoritative.
export type CourseMinimalInput = {
  code: string;
  classNumber: string;
  instructor: string;
  semester: string;
  // Human-friendly code with the conventional space, e.g. "COP 3502". Optional;
  // falls back to inserting a space via the same rule auto-fetch uses.
  codeWithSpace?: string;
};

function prettyCode(code: string, fallback?: string): string {
  if (fallback && fallback.trim()) return fallback.trim();
  const m = code.match(/^([A-Z]{2,4})(\d{3,4}[A-Z]?)$/);
  return m ? `${m[1]} ${m[2]}` : code;
}

export function parseCoursesMinimal(
  courses: CourseMinimalInput[]
): CourseOption[] {
  return courses.map(
    ({ code, classNumber, instructor, semester, codeWithSpace }) => {
      const safeCode = String(code ?? '')
        .trim()
        .toUpperCase();
      const display = prettyCode(safeCode, codeWithSpace);
      const instrClean = String(instructor ?? '').trim();
      const safeInstructor =
        instrClean && instrClean.toLowerCase() !== 'undefined'
          ? instrClean
          : 'Instructor Unknown';
      const department = safeCode.slice(0, 3).toUpperCase();
      const docId = `${safeCode}__${String(classNumber ?? '').trim()}`;

      return {
        code: safeCode,
        instructor: safeInstructor,
        department,
        semester,
        value: `${semester}|||${docId}`,
        name: `${display} : ${safeInstructor} (${semester})`,
      };
    }
  );
}
