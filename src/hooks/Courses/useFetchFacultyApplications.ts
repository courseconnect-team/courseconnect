// firebase/courses.ts
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import {
  useQuery,
  UseQueryResult,
  keepPreviousData,
} from '@tanstack/react-query';
import type { SemesterName } from '../useSemesterOptions';
import type { CourseTuple } from './useFetchFacultyMultiApplications';

interface CourseDoc {
  code?: string | null;
  title?: string | null;
  professor_emails?: string[]; // keep type flexible during migration
  // termId?: string;             // include if you duplicated it in each doc
}

/** ----- Per-term (new schema) ----- */
export async function getFacultyCourses(
  semester: SemesterName,
  uemail: string
): Promise<CourseTuple[]> {
  // semesters/{termId}/courses
  const db = firebase.firestore();
  const q = db
    .collection('semesters')
    .doc(semester)
    .collection('courses')
    .where('professor_emails', 'array-contains', uemail);

  const snap = await q.get();
  const rows: CourseTuple[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data() as CourseDoc;
    if (d.code && d.title) rows.push([docSnap.id, d.code, d.title, semester]);
  });
  return rows;
}

/** ----- (Optional) Across all terms using collectionGroup ----- */
export async function getFacultyCoursesAllTerms(
  uemail: string
): Promise<CourseTuple[]> {
  const db = firebase.firestore();

  // requires a composite index if you also filter/order by other fields
  const q = db
    .collectionGroup('courses')
    .where('professor_emails', 'array-contains', uemail);
  const snap = await q.get();

  const rows: CourseTuple[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data() as CourseDoc;
    // recover the termId from the parent doc id (semesters/{termId}/courses/{offeringId})
    const termId = docSnap.ref.parent.parent?.id as SemesterName;
    if (d.code && d.title && termId)
      rows.push([docSnap.id, d.code, d.title, termId]);
  });
  return rows;
}

/** Cached hook (per-term) */
export function useFacultyCourses(
  semester?: SemesterName,
  uemail?: string,
  enabled = true
): UseQueryResult<CourseTuple[], Error> {
  return useQuery<CourseTuple[], Error>({
    queryKey: ['facultyCourses', uemail, semester], // include semester in the key
    queryFn: () => getFacultyCourses(semester!, uemail!),
    enabled: enabled && !!semester && !!uemail,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/** (Optional) Cached hook across all terms */
export function useFacultyCoursesAllTerms(uemail?: string, enabled = true) {
  return useQuery<CourseTuple[], Error>({
    queryKey: ['facultyCoursesAllTerms', uemail],
    queryFn: () => getFacultyCoursesAllTerms(uemail!),
    enabled: enabled && !!uemail,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
