// hooks/fetchers/fetchAssignments.ts
import firebase from '@/firebase/firebase_config';
import { useQuery } from '@tanstack/react-query';


export type AssignmentsPayload = {
  assignments: string[];
  courses: any;
  adminDenied: boolean;
  position: string;
  dateApplied: string;
};

async function fetchAssignments(userId: string): Promise<AssignmentsPayload> {
  const db = firebase.firestore();

  // ----- applications/{userId}
  const appSnap = await db.collection('applications').doc(userId).get();

  const adminDenied = appSnap.exists ? appSnap.data()?.status === 'Admin_denied' : false;
  const positionFromApp = appSnap.exists ? appSnap.data()?.position : undefined;
  const dateFromApp = appSnap.exists ? appSnap.data()?.date : undefined;
  const courses = appSnap.exists ? appSnap.data()?.courses ?? null : null;

  // ----- assignments/{userId}, assignments/{userId}-1, -2, ...
  const assignments: string[] = [];
  let counter = 0;
  let ref = db.collection('assignments').doc(userId);
  let position = positionFromApp ?? 'not listed';
  let dateApplied = dateFromApp ?? 'not listed';

  // walk sequential docs
  // (stop when the next doc doesn't exist)
  // NOTE: if you have a better schema (e.g., subcollection), switch to a single query
  while (true) {
    const snap = await ref.get();
    if (!snap.exists) break;

    const data = snap.data() || {};
    if (data.class_codes) assignments.push(data.class_codes);
    if (data.position) position = data.position;
    if (data.date) dateApplied = data.date;

    counter += 1;
    ref = db.collection('assignments').doc(`${userId}-${counter}`);
  }

  return {
    assignments,
    courses,
    adminDenied,
    position: position ?? 'not listed',
    dateApplied: dateApplied ?? 'not listed',
  };
}
interface UseFetchAssignmentsResult {
  assignments: string[];
  courses: any;
  adminDenied: boolean;
  position: string;
  dateApplied: string;
  loading: boolean;
  error: string | null;
  isFetching: boolean; // optional: expose fetch status separately
}

export function useFetchAssignments(userId?: string): UseFetchAssignmentsResult{
  const enabled = !!userId;

  const {data,
    isLoading,
    isFetching,
    error,
  } = useQuery<AssignmentsPayload, Error>({
    queryKey: ['assignments', userId],
    queryFn: () => fetchAssignments(userId!),
    enabled,
    staleTime: 5 * 60 * 1000,    
    gcTime:30*60*1000,
    refetchOnWindowFocus: false,
    retry: 1,

  });

  return{
    assignments: data?.assignments ?? [],
    courses: data?.courses ?? null,
    adminDenied: data?.adminDenied ?? false,
    position: data?.position ?? 'not listed',
    dateApplied: data?.dateApplied ?? 'not listed',
    loading: enabled ? isLoading : false,
    isFetching,
    error: error ? 'Failed to fetch data' : null,
  };
}