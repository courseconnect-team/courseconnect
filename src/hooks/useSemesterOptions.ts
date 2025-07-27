import { useMemo, useState } from 'react';

export type SemesterName = `${'Spring' | 'Summer' | 'Fall'} ${number}`;

const getCurrentSemester = (): SemesterName => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan

  const term = month < 5 ? 'Spring' : month < 8 ? 'Summer' : 'Fall';
  return `${term} ${year}` as SemesterName;
};

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
