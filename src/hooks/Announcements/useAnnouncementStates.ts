'use client';

import { useEffect, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { AnnouncementState } from '@/types/announcement';

/**
 * Subscribes to the current user's announcement-state subcollection
 * (`users/{uid}/announcementStates`) and returns a live `Map` keyed
 * by announcement id.
 *
 * Returns an empty map / non-loading state when `uid` is falsy, so
 * callers can always call this hook unconditionally.
 */
export function useAnnouncementStates(uid: string | undefined | null): {
  statesById: Map<string, AnnouncementState>;
  loading: boolean;
  error: Error | null;
} {
  const [statesById, setStatesById] = useState<Map<string, AnnouncementState>>(
    () => new Map()
  );
  const [loading, setLoading] = useState<boolean>(Boolean(uid));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setStatesById(new Map());
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const ref = firebase
      .firestore()
      .collection('users')
      .doc(uid)
      .collection('announcementStates');

    const unsub = ref.onSnapshot(
      (snap) => {
        const next = new Map<string, AnnouncementState>();
        snap.docs.forEach((doc) => {
          const d = doc.data() as any;
          next.set(doc.id, {
            announcementId: d.announcementId ?? doc.id,
            readAt: toDate(d.readAt),
            ackedAt: toDate(d.ackedAt),
          });
        });
        setStatesById(next);
        setLoading(false);
      },
      (err) => {
        console.error('announcementStates listener error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, [uid]);

  return { statesById, loading, error };
}

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  return null;
}

export default useAnnouncementStates;
