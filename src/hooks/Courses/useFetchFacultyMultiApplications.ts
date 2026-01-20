import {
  useQuery,
  keepPreviousData,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as React from 'react';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { SemesterName } from '../useSemesterOptions';

export type CourseTuple = [string, string, string, SemesterName];
interface CourseDoc {
  code?: string | null;
  title?: string | null;
  semester: string;
  professor_emails: string[];
}
export interface CourseRow {
  id: string;
  code: string;
  title: string;
  semester: string;
}
/** Multi-semester fetcher (chunks by 10 due to Firestore `in` limit). */
export async function getFacultyCoursesMany(
  semesters: string[],
  uemail: string
): Promise<CourseRow[]> {
  if (!semesters.length) return [];
  const db = firebase.firestore();

  const chunks: string[][] = [];
  for (let i = 0; i < semesters.length; i += 10)
    chunks.push(semesters.slice(i, i + 10));

  const results = await Promise.all(
    chunks.map(async (semChunk) => {
      const q = db
        .collection('courses')
        .where('semester', 'in', semChunk)
        .where('professor_emails', 'array-contains', uemail);
      const snap = await q.get();
      const rows: CourseRow[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data() as CourseDoc;
        if (d.code && d.title)
          rows.push({
            id: docSnap.id,
            code: d.code,
            title: d.title,
            semester: d.semester,
          });
      });
      return rows;
    })
  );

  const seen = new Set<string>();
  const merged: CourseRow[] = [];
  for (const arr of results) {
    for (const r of arr) {
      const key = `${r.id}::${r.semester}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(r);
      }
    }
  }
  merged.sort((a, b) =>
    a.semester < b.semester
      ? 1
      : a.semester > b.semester
      ? -1
      : a.code.localeCompare(b.code)
  );
  return merged;
}

export function useFacultyCoursesMany(
  semesters?: string[],
  uemail?: string,
  enabled = true
): UseQueryResult<CourseRow[], Error> {
  const sorted = React.useMemo(
    () => (semesters ? [...semesters].sort() : []),
    [semesters?.join('|')]
  );
  return useQuery<CourseRow[], Error>({
    queryKey: ['facultyCoursesMany', uemail, ...sorted],
    queryFn: () => getFacultyCoursesMany(sorted!, uemail!),
    enabled: enabled && !!uemail && sorted.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
