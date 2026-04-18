'use client';

import { useCallback, useEffect, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

/**
 * A single acknowledged user, as rendered by the sender/admin ack panel.
 */
export type AckedUser = {
  uid: string;
  displayName: string;
  ackedAt: Date | null;
};

type UseAckSummaryResult = {
  ackedUsers: AckedUser[];
  total: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v.seconds === 'number') {
    const ms = v.seconds * 1000 + Math.floor((v.nanoseconds ?? 0) / 1_000_000);
    return new Date(ms);
  }
  return null;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/**
 * Resolve a set of uids → `{ uid → displayName }` by batching Firestore
 * `documentId() in [...]` queries (max 10 ids each). Unresolved uids
 * fall back to the uid itself as the display name; callers get a
 * complete map keyed by every requested uid.
 */
async function resolveDisplayNames(
  uids: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (uids.length === 0) return out;

  // Pre-seed with uid-as-fallback so unresolved uids still have an entry.
  uids.forEach((u) => out.set(u, u));

  const usersCol = firebase.firestore().collection('users');
  const fieldPath = firebase.firestore.FieldPath.documentId();

  for (const group of chunk(uids, 10)) {
    try {
      const snap = await usersCol.where(fieldPath, 'in', group).get();
      snap.docs.forEach((doc) => {
        const d = doc.data() as any;
        const name: string =
          (typeof d?.displayName === 'string' && d.displayName.trim()) ||
          (typeof d?.name === 'string' && d.name.trim()) ||
          (typeof d?.email === 'string' && d.email.trim()) ||
          doc.id;
        out.set(doc.id, name);
      });
    } catch (err) {
      // Non-fatal: unresolved uids stay as their own uid.
      console.error('Failed to resolve user display names:', err);
    }
  }

  return out;
}

/**
 * Subscribes to `collectionGroup('announcementStates')` filtered by
 * `announcementId`, filters to acked state docs, and resolves user
 * display names for each. Also performs a one-shot read of the
 * announcement's `recipientCount` for the denominator.
 *
 * Returns a `refetch()` that re-fires the name resolution + total read.
 * The collection-group subscription itself is already live; refetch is
 * mostly useful after an error state to re-attempt the name resolve.
 */
export function useAckSummary(
  announcementId: string | undefined | null
): UseAckSummaryResult {
  const [ackedUsers, setAckedUsers] = useState<AckedUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [stateLoading, setStateLoading] = useState<boolean>(
    Boolean(announcementId)
  );
  const [totalLoading, setTotalLoading] = useState<boolean>(
    Boolean(announcementId)
  );
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- Subscription to the collection-group query ---
  useEffect(() => {
    if (!announcementId) {
      setAckedUsers([]);
      setStateLoading(false);
      setError(null);
      return;
    }

    setStateLoading(true);
    setError(null);

    const q = firebase
      .firestore()
      .collectionGroup('announcementStates')
      .where('announcementId', '==', announcementId);

    let cancelled = false;

    const unsub = q.onSnapshot(
      async (snap) => {
        // Pull acked docs and the owning uid (the grandparent doc id).
        const preliminary: { uid: string; ackedAt: Date | null }[] = [];
        snap.docs.forEach((doc) => {
          const d = doc.data() as any;
          const ackedAt = toDate(d?.ackedAt);
          if (!ackedAt) return;
          const userDocRef = doc.ref.parent.parent;
          if (!userDocRef) return;
          preliminary.push({ uid: userDocRef.id, ackedAt });
        });

        const uids = preliminary.map((p) => p.uid);
        const names = await resolveDisplayNames(uids);

        if (cancelled) return;

        const resolved: AckedUser[] = preliminary.map((p) => ({
          uid: p.uid,
          displayName: names.get(p.uid) ?? p.uid,
          ackedAt: p.ackedAt,
        }));

        // Sort acknowledged users by ack time ascending — the panel
        // renders in this order too, but sorting here keeps callers
        // simple.
        resolved.sort((a, b) => {
          const aMs = a.ackedAt ? a.ackedAt.getTime() : 0;
          const bMs = b.ackedAt ? b.ackedAt.getTime() : 0;
          return aMs - bMs;
        });

        setAckedUsers(resolved);
        setStateLoading(false);
      },
      (err) => {
        if (cancelled) return;
        console.error('useAckSummary listener error:', err);
        setError(err);
        setStateLoading(false);
      }
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [announcementId, refreshKey]);

  // --- One-shot total (recipientCount snapshot on the announcement) ---
  useEffect(() => {
    if (!announcementId) {
      setTotal(0);
      setTotalLoading(false);
      return;
    }

    let cancelled = false;
    setTotalLoading(true);

    firebase
      .firestore()
      .collection('announcements')
      .doc(announcementId)
      .get()
      .then((snap) => {
        if (cancelled) return;
        const d = snap.data() as any;
        const n = typeof d?.recipientCount === 'number' ? d.recipientCount : 0;
        setTotal(n);
        setTotalLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('useAckSummary total fetch error:', err);
        setError((prev) => prev ?? err);
        setTotalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [announcementId, refreshKey]);

  const refetch = useCallback(() => {
    setError(null);
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    ackedUsers,
    total,
    loading: stateLoading || totalLoading,
    error,
    refetch,
  };
}

export default useAckSummary;
