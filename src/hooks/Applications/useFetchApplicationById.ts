import { ApplicationData } from '@/types/query';
import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import { ApplicationRepository, ApplicationType } from '@/firebase/applications/applicationRepository';
import { getFirestore } from 'firebase/firestore';

import { ApplicationOptions, AppQueryKey } from '@/types/query';

// Get the modular firestore instance for the repository
const db = getFirestore();
const repo = new ApplicationRepository(db);

/**
 * Low-level fetcher: returns `null` if the doc doesn't exist.
 * Requires applicationType and applicationId, or just userId for latest app
 */
async function fetchApplicationById(
  id: string,
  applicationType?: ApplicationType,
  applicationId?: string
): Promise<ApplicationData | null> {
  // If we have both applicationType and applicationId, fetch specific application
  if (applicationType && applicationId) {
    return await repo.getApplicationById(applicationType, applicationId);
  }

  // Otherwise, try to fetch latest application by treating id as userId
  // Try to fetch latest course_assistant application first
  const courseAssistantApp = await repo.getLatestApplication(id, 'course_assistant');
  if (courseAssistantApp) return courseAssistantApp;

  // Then try supervised_teaching
  const supervisedTeachingApp = await repo.getLatestApplication(id, 'supervised_teaching');
  if (supervisedTeachingApp) return supervisedTeachingApp;

  return null;
}

/** Hook: hydrate from cache/initialData if provided; fetch by id only when enabled. */
export function useFetchApplicationById(
  id: string | undefined,
  opts?: ApplicationOptions & {
    applicationType?: ApplicationType;
    applicationId?: string;
  }
): UseQueryResult<ApplicationData | null, Error> {
  const { applicationType, applicationId, ...queryOpts } = opts || {};

  return useQuery<
    ApplicationData | null,
    Error,
    ApplicationData | null,
    AppQueryKey
  >({
    queryKey: ['application', id ?? ''],
    enabled: Boolean(id) && (queryOpts?.enabled ?? true),
    queryFn: () => fetchApplicationById(id!, applicationType, applicationId),
    staleTime: queryOpts?.staleTime ?? 5 * 60_000,
    gcTime: queryOpts?.gcTime ?? 30 * 60_000,
    initialData: queryOpts?.initialData,
    ...queryOpts,
  });
}
