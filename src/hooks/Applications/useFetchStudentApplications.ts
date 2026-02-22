// hooks/fetchers/fetchAssignments.ts
import { isE2EMode } from '@/utils/featureFlags';
import { useQuery } from '@tanstack/react-query';
import { ApplicationRepository } from '@/firebase/applications/applicationRepository';
import { getFirestore } from 'firebase/firestore';

export type AssignmentsPayload = {
  assignments: string[];
  courses: any;
  adminApproved: boolean;
  adminDenied: boolean;
  position: string;
  dateApplied: string;
};

const db = getFirestore();
const repo = new ApplicationRepository(db);

async function fetchAssignments(userId: string): Promise<AssignmentsPayload> {
  const latestApp = await repo.getLatestApplication(userId, 'course_assistant');

  if (latestApp) {
    const adminDenied = latestApp.status === 'Admin_denied';
    const adminApproved = latestApp.status === 'Admin_approved';

    return {
      assignments: [],
      courses: latestApp.courses ?? null,
      adminApproved,
      adminDenied,
      position: latestApp.position ?? 'not listed',
      dateApplied: latestApp.date ?? 'not listed',
    };
  }

  // No application found
  return {
    assignments: [],
    courses: null,
    adminApproved: false,
    adminDenied: false,
    position: 'not listed',
    dateApplied: 'not listed',
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
