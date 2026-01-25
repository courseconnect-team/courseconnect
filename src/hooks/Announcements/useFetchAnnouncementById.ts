import firebase from '@/firebase/firebase_config';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { Announcement } from '@/types/announcement';
import { AnnouncementByIdOptions } from '@/types/query';

/** Low-level fetcher */
async function fetchAnnouncementById(id: string): Promise<Announcement | null> {
  const snap = await firebase
    .firestore()
    .collection('announcements')
    .doc(id)
    .get();
  if (!snap.exists) return null;

  const d = snap.data() as any;

  // If your Announcement type expects Dates, consider converting timestamps here.
  return { id: snap.id, ...d } as Announcement;
}

export function useFetchAnnouncementById(
  id: string | undefined,
  opts?: AnnouncementByIdOptions
): UseQueryResult<Announcement | null, Error> {
  return useQuery({
    queryKey: ['announcements', 'id', id ?? ''],
    enabled: Boolean(id) && (opts?.enabled ?? true),
    queryFn: () => fetchAnnouncementById(id!),
    staleTime: opts?.staleTime ?? 5 * 60_000,
    gcTime: opts?.gcTime ?? 30 * 60_000,
    initialData: opts?.initialData,
    ...(opts ?? {}),
  });
}
