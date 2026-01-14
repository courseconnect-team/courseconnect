import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  Announcement,
  Audience,
  AudienceDepartment,
  AudienceRole,
} from '@/types/announcement';
import { useUserTimestamp } from '../User/useGetUserInfo';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Role } from '@/types/User';

type UseFetchAnnouncementsOptions = {
  limit?: number;
  realtime?: boolean;
  userRole: Role;
  userEmail: string;
  userDepartment: AudienceDepartment;
  channel?: string; // default: 'inApp'

  /**
   * By default we only show "completed" announcements.
   * If you want admins to preview pending ones, set includePending=true.
   * (Note: mixing statuses may require an index / different query plan.)
   */
  includePending?: boolean;

  /**
   * If true, only return pinned announcements.
   * If false/undefined, return both pinned + unpinned (with pinned ordered first).
   */
  onlyPinned?: boolean;
};
function convertRole(role: string): AudienceRole {
  switch (role) {
    case 'admin':
      return 'admin';
    case 'faculty':
      return 'faculty';
    default:
      return 'student';
  }
}
function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate(); // Firestore Timestamp
  return null;
}

function toMillis(v: any): number | null {
  if (!v) return null;
  if (v instanceof Date) return v.getTime();
  if (typeof v.toMillis === 'function') return v.toMillis(); // Firestore Timestamp
  return null;
}

function mapDoc(doc: firebase.firestore.QueryDocumentSnapshot): Announcement {
  const d = doc.data() as any;

  return {
    id: doc.id,
    title: d.title ?? '',
    bodyMd: d.bodyMd ?? '',
    pinned: !!d.pinned,

    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
    scheduledAt: toDate(d.scheduledAt),
    expiresAt: toDate(d.expiresAt),

    senderId: d.senderId ?? '',
    senderName: d.senderName ?? null,
    audienceTokens: Array.isArray(d.audienceTokens) ? d.audienceTokens : [],
    channels: Array.isArray(d.channels) ? d.channels : [],
    audience: (d.audience ?? { type: 'all' }) as Audience,

    dispatchStatus: d.dispatchStatus ?? 'unknown',
  };
}

type Page = {
  items: Announcement[];
  lastDoc: firebase.firestore.QueryDocumentSnapshot | null;
};

function announcementsQueryKey(
  opts: Required<Omit<UseFetchAnnouncementsOptions, 'realtime'>>
) {
  return [
    'announcements',
    {
      limit: opts.limit,
      channel: opts.channel,
      includePending: opts.includePending,
      onlyPinned: opts.onlyPinned,
    },
  ] as const;
}

export function useFetchAnnouncementsForAccount(
  options: UseFetchAnnouncementsOptions
) {
  const {
    limit = 20,
    realtime = true,
    channel = 'inApp',
    userRole: roleKey,
    userEmail,
    userDepartment,
    includePending = false,
    onlyPinned = false,
  } = options;

  const queryClient = useQueryClient();
  const baseKey = announcementsQueryKey({
    limit,
    channel,
    userRole: roleKey,
    userEmail,
    userDepartment,
    includePending,
    onlyPinned,
  });
  const userRole = convertRole(roleKey);

  const applyCommon = (q: firebase.firestore.Query) => {
    q = q.where(`channels.${channel}`, '==', true);

    if (!includePending) {
      q = q.where('dispatchStatus', '==', 'completed');
    }

    if (onlyPinned) {
      // pinned == true -> ordering by pinned is unnecessary
      q = q.where('pinned', '==', true).orderBy('createdAt', 'desc');
    } else {
      q = q.orderBy('pinned', 'desc').orderBy('createdAt', 'desc');
    }

    return q;
  };

  const buildQuery = React.useCallback(() => {
    const col = firebase.firestore().collection('announcements');
    let q = applyCommon(col);

    if (userRole === 'admin') {
      return q;
    }
    const isNonEmpty = (v: string | null | undefined): v is string =>
      typeof v === 'string' && v.trim().length > 0;

    const norm = (s: string) => s.trim().toLowerCase();

    const tokens = [
      'all',
      userRole ? `role:${norm(userRole)}` : null,
      userRole === 'faculty' ? `role:student` : null,
      userDepartment ? `dept:${norm(userDepartment)}` : null,
      userEmail ? `user:${norm(userEmail)}` : null,
    ].filter(isNonEmpty);

    q = q.where('audienceTokens', 'array-contains-any', tokens);
    return q;
  }, [
    channel,
    includePending,
    onlyPinned,
    userRole,
    userDepartment,
    userEmail,
  ]);

  const fetchPage = useCallback(
    async (
      cursor?: firebase.firestore.QueryDocumentSnapshot | null
    ): Promise<Page> => {
      let q = buildQuery().limit(limit);
      if (cursor) q = q.startAfter(cursor);

      const snap = await q.get();
      const docs = snap.docs;

      return {
        items: docs.map(mapDoc),
        lastDoc: docs.length ? docs[docs.length - 1] : null,
      };
    },
    [buildQuery, limit]
  );

  const query = useInfiniteQuery({
    queryKey: baseKey,
    initialPageParam: null as firebase.firestore.QueryDocumentSnapshot | null,
    queryFn: async ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.lastDoc,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!realtime) return;
    const unsub = buildQuery()
      .limit(limit)
      .onSnapshot(
        (snap) => {
          const docs = snap.docs;
          const page0: Page = {
            items: docs.map(mapDoc),
            lastDoc: docs.length ? docs[docs.length - 1] : null,
          };

          queryClient.setQueryData(baseKey, (old: any) => {
            if (!old) {
              return { pages: [page0], pageParams: [null] };
            }
            const pages = Array.isArray(old.pages) ? [...old.pages] : [];
            pages[0] = page0;
            return { ...old, pages };
          });
        },
        () => {}
      );
    return () => unsub();
  }, [realtime, buildQuery, limit, queryClient, baseKey]);

  const announcements = useMemo(() => {
    const pages = query.data?.pages ?? [];
    const out: Announcement[] = [];
    const seen = new Set<string>();
    for (const p of pages) {
      for (const a of p.items) {
        if (seen.has(a.id!)) continue;
        seen.add(a.id!);
        out.push(a);
      }
    }
    return out;
  }, [query.data]);

  const lastSeenMs = toMillis(useUserTimestamp());
  const { unread, read } = announcements.reduce(
    (acc, a) => {
      const tMs = toMillis(a.scheduledAt ?? a.createdAt);
      const isUnread = lastSeenMs === null ? true : (tMs ?? 0) > lastSeenMs;

      (isUnread ? acc.unread : acc.read).push(a);
      return acc;
    },
    { unread: [] as Announcement[], read: [] as Announcement[] }
  );
  return {
    read,
    unread,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    error: query.error,
    refresh: query.refetch,
    loadMore: () => query.fetchNextPage(),
  };
}
