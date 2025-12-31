// hooks/fetchers/fetchAssignments.ts
import firebase from '@/firebase/firebase_config';
import { isE2EMode } from '@/utils/featureFlags';
import { useQuery } from '@tanstack/react-query';

export type AssignmentsPayload = {
  assignments: string[];
  courses: any;
  adminApproved: boolean;
  adminDenied: boolean;
  position: string;
  dateApplied: string;
};

async function fetchAssignments(userId: string): Promise<AssignmentsPayload> {
  const db = firebase.firestore();

  const appSnap = await db.collection('applications').doc(userId).get();

  const adminDenied = appSnap.exists
    ? appSnap.data()?.status === 'Admin_denied'
    : false;
  const adminApproved = appSnap.exists
    ? appSnap.data()?.status === 'Admin_approved'
    : false;

  const positionFromApp = appSnap.exists ? appSnap.data()?.position : undefined;
  const dateFromApp = appSnap.exists ? appSnap.data()?.date : undefined;
  const courses = appSnap.exists ? appSnap.data()?.courses ?? null : null;

  const assignments: string[] = [];
  const position = positionFromApp ?? 'not listed';
  const dateApplied = dateFromApp ?? 'not listed';

  return {
    assignments,
    courses,
    adminApproved,
    adminDenied,
    position,
    dateApplied,
  };
}

interface UseFetchAssignmentsResult {
  assignments: string[];
  courses: any;
  adminApproved: boolean;
  adminDenied: boolean;
  position: string;
  dateApplied: string;
  loading: boolean;
  error: string | null;
  isFetching: boolean;
}

// ✅ Stub the QUERY DATA shape (AssignmentsPayload), not the hook result shape
const STUB_PAYLOAD: AssignmentsPayload = {
  assignments: [],
  courses: null,
  adminApproved: false,
  adminDenied: false,
  position: 'not listed',
  dateApplied: 'not listed',
};

export function useFetchAssignments(
  userId?: string
): UseFetchAssignmentsResult {
  const isE2E = isE2EMode();

  // In E2E we don't want Firebase calls at all
  const enabled = !!userId && !isE2E;

  const { data, isLoading, isFetching, error } = useQuery<
    AssignmentsPayload,
    Error
  >({
    queryKey: ['assignments', userId ?? ''],
    queryFn: () => fetchAssignments(userId!),
    enabled,
    initialData: isE2E ? STUB_PAYLOAD : undefined,
    staleTime: isE2E ? Infinity : 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const payload = isE2E ? STUB_PAYLOAD : data;

  return {
    assignments: payload?.assignments ?? [],
    courses: payload?.courses ?? null,
    adminApproved: payload?.adminApproved ?? false,
    adminDenied: payload?.adminDenied ?? false,
    position: payload?.position ?? 'not listed',
    dateApplied: payload?.dateApplied ?? 'not listed',
    loading: enabled ? isLoading : false,
    isFetching: enabled ? isFetching : false,
    error: enabled && error ? 'Failed to fetch data' : null,
  };
}
