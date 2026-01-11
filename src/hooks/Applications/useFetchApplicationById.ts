import firebase from '@/firebase/firebase_config';
import { ApplicationData } from '@/types/query';
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';

import { ApplicationOptions, AppQueryKey } from '@/types/query';
/** Low-level fetcher: returns `null` if the doc doesn't exist. Throws on network errors. */
async function fetchApplicationById(
  id: string
): Promise<ApplicationData | null> {
  const snap = await firebase
    .firestore()
    .collection('applications')
    .doc(id)
    .get();
  if (!snap.exists) return null;
  const d = snap.data() as Omit<ApplicationData, 'id'>;
  return { id: snap.id, ...d };
}

/** Hook: hydrate from cache/initialData if provided; fetch by id only when enabled. */
export function useFetchApplicationById(
  id: string | undefined,
  opts?: ApplicationOptions
): UseQueryResult<ApplicationData | null, Error> {
  return useQuery<
    ApplicationData | null,
    Error,
    ApplicationData | null,
    AppQueryKey
  >({
    queryKey: ['application', id ?? ''],
    enabled: Boolean(id) && (opts?.enabled ?? true),
    queryFn: () => fetchApplicationById(id!),
    staleTime: opts?.staleTime ?? 5 * 60_000,
    gcTime: opts?.gcTime ?? 30 * 60_000,
    initialData: opts?.initialData,
    ...opts,
  });
}
