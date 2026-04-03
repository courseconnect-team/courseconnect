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
    (s) => s === `${currentTerm} ${currentYear}` as SemesterName
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

export function parseCoursesMinimal(
  courses: { raw: string; semester: string }[]
): CourseOption[] {
  return courses.map(({ raw, semester }) => {
    const safe = String(raw ?? '').trim();
    const [left, right = ''] = safe.split(':', 2);
    const code = (left ?? '').trim();
    const instrRaw = right.trim();

    const instructor =
      instrRaw && instrRaw.toLowerCase() !== 'undefined'
        ? instrRaw
        : 'Instructor Unknown';

    const department = code.slice(0, 3).toUpperCase();

    return {
      code,
      instructor,
      department,
      semester,
      value: `${semester}|||${safe}`,
      name: `${code} : ${instructor} (${semester})`,
    };
  });
}
