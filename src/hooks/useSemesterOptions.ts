import { useMemo, useState } from 'react';
import firebase from '@/firebase/firebase_config';

export type SemesterName = `${'Spring' | 'Summer' | 'Fall'} ${number}`;

export const getCurrentSemester = (): SemesterName => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0 = Jan
  const day = now.getDate();

  const term = month < 5 ? 'Spring' : month < 8 ? 'Summer' : 'Fall';

  return `${term} ${year}` as SemesterName;
};

export function generateSemesters(startYear = 2023): SemesterName[] {
  const currentYear = new Date().getFullYear();
  const out: string[] = [];
  for (let y = startYear; y <= currentYear; y++) {
    out.push(`Spring ${y}`, `Summer ${y}`, `Fall ${y}`);
  }

  return out.reverse() as SemesterName[];
}

const generateSemesterNames = (
  start: SemesterName,
  count: number
): SemesterName[] => {
  const result: SemesterName[] = [start];
  let [term, year] = start.split(' ') as ['Spring' | 'Summer' | 'Fall', string];
  for (let i = 0; i < count - 1; i++) {
    if (term === 'Spring') term = 'Summer';
    else if (term === 'Summer') term = 'Fall';
    else {
      term = 'Spring';
      year = String(Number(year) + 1);
    }
    result.push(`${term} ${year}` as SemesterName);
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
    options, // ['Spring 2025', 'Summer 2025', 'Fall 2025', ...]
    currentSemester: current,
  };
}

export async function fetchSemesterIds(): Promise<string[]> {
  const snap = await firebase.firestore().collection('semesters').get();
  return snap.docs.map((doc) => doc.id);
}

export async function fetchClosestSemesters(n: number): Promise<string[]> {
  const snap = await firebase
    .firestore()
    .collection('semesters')
    .orderBy('sortKey', 'desc')
    .limit(n)
    .get();
  return snap.docs.map((doc) => doc.id);
}

export const TERM_CODE: Record<string, number> = {
  Spring: 1,
  Summer: 2,
  Fall: 3,
};

export type CourseOption = {
  code: string;
  instructor: string;
  department: string;
  value: string; // stable id (e.g., original raw)
  name: string; // display label
};

export function parseCoursesMinimal(names: string[]): CourseOption[] {
  return names.map((name) => {
    const safe = String(name ?? '').trim();
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
      value: name,
      name: `${code} : ${instructor}`,
    };
  });
}
