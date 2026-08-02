// firebase/courses.ts
import firebase from '@/firebase/firebase_config';
import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  useQuery,
  UseQueryResult,
  keepPreviousData,
} from '@tanstack/react-query';
import type { SemesterName } from '../useSemesterOptions';
import type { CourseTuple } from './useFetchFacultyMultiApplications';
import { emailToUsername } from '@/utils/email';

interface CourseDoc {
  code?: string | null;
  title?: string | null;
  professor_usernames?: string[];
  // termId?: string;             // include if you duplicated it in each doc
}

/** ----- Per-term (new schema) ----- */
export async function getFacultyCourses(
  semester: SemesterName,
  uemail: string,
  aliasEmails: string[] = []
): Promise<CourseTuple[]> {
  // A course belongs to a professor when their email is listed in the course
  // doc's `professor_emails`. Match on the full address (lowercased) — the
  // login email plus any linked alias emails.
  const db = firebase.firestore();
  const emails = Array.from(
    new Set(
      [uemail, ...aliasEmails]
        .map((e) => (e ?? '').trim().toLowerCase())
        .filter(Boolean)
    )
  );
  if (emails.length === 0) return [];
  const col = collection(db, 'semesters', semester, 'courses');
  const q =
    emails.length === 1
      ? query(col, where('professor_emails', 'array-contains', emails[0]))
      : query(col, where('professor_emails', 'array-contains-any', emails));

  const snap = await getDocs(q);
  const rows: CourseTuple[] = [];
  snap.forEach((doc) => {
    const d = doc.data() as CourseDoc;
    if (d.code && d.title) rows.push([doc.id, d.code, d.title, semester]);
  });
  return rows;
}

/** ----- (Optional) Across all terms using collectionGroup ----- */
export async function getFacultyCoursesAllTerms(
  uemail: string
): Promise<CourseTuple[]> {
  const db = firebase.firestore();
  const username = emailToUsername(uemail);
  if (!username) return [];

  // requires a composite index if you also filter/order by other fields
  const q = query(
    collectionGroup(db, 'courses'),
    where('professor_usernames', 'array-contains', username)
  );
  const snap = await getDocs(q);

  const rows: CourseTuple[] = [];
  snap.forEach((doc) => {
    const d = doc.data() as CourseDoc;
    // recover the termId from the parent doc id (semesters/{termId}/courses/{offeringId})
    const termId = doc.ref.parent.parent?.id as SemesterName;
    if (d.code && d.title && termId)
      rows.push([doc.id, d.code, d.title, termId]);
  });
  return rows;
}

/** Cached hook (per-term) */
export function useFacultyCourses(
  semester?: SemesterName,
  uemail?: string,
  aliasEmails: string[] = [],
  enabled = true
): UseQueryResult<CourseTuple[], Error> {
  return useQuery<CourseTuple[], Error>({
    queryKey: ['facultyCourses', uemail, semester, ...aliasEmails],
    queryFn: () => getFacultyCourses(semester!, uemail!, aliasEmails),
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
