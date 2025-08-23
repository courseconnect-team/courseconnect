// firebase/courses.ts
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { useQuery, UseQueryResult, keepPreviousData } from '@tanstack/react-query';
import firebase from '@/firebase/firebase_config';
import { SemesterName } from '../useSemesterOptions';
/** Tuple we return → [docId, courseCode, courseTitle] */
export type CourseTuple = [string, string, string];

interface CourseDoc {
  code?: string | null;
  title?: string | null;
  semester: string;
  professor_emails: string[];
}

/** Network fetcher (no caching here) */
export async function getFacultyCourses(
  semester: SemesterName,
  uemail: string
): Promise<CourseTuple[]> {
  const db = firebase.firestore();

  const q = query(
    collection(db, 'courses'),
    where('semester', '==', semester),
    where('professor_emails', 'array-contains', uemail)
  );

  let snap = await getDocs(q);

  const rows: CourseTuple[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as CourseDoc;
    if (data.code && data.title) rows.push([doc.id, data.code, data.title]);
  });

  const q1 = query(
    collection(db, 'past-courses'),
    where('semester', '==', semester),
    where('professor_emails', "==", uemail)
  );
  snap = await getDocs(q1);

  snap.forEach((doc) => {
    const data = doc.data() as CourseDoc;
    if (data.code && data.title) rows.push([doc.id, data.code, data.title]);
  });

  return rows;
}

/** ✅ Cached hook using TanStack Query */
export function useFacultyCourses(
  semester?: SemesterName,
  uemail?: string,
  enabled = true
): UseQueryResult<CourseTuple[], Error> {
  return useQuery<CourseTuple[], Error>({
    queryKey: ['facultyCourses', uemail, semester],
    queryFn: () => getFacultyCourses(semester!, uemail!),
    enabled: enabled && !!semester && !!uemail,       // don't run until both provided
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,              // 5m considered fresh
    gcTime: 30 * 60 * 1000,                // 30m kept in cache if unused
    refetchOnWindowFocus: false,           // optional: no refetch on focus
    retry: 1,                              // optional: fewer retries
  });
}
