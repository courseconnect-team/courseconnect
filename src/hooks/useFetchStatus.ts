import { useEffect, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
/**
 * Custom hook that aggregates a student/faculty member’s dashboard‑relevant data.
 * ────────────────────────────────────────────────────────────────────────────
 * • Crawls the `assignments` collection, collecting *all* `class_codes` that
 *   live under sequential docs:   userId,  userId-1, userId-2 …
 * • Reads their application record (`applications/{userId}`) to pull courses
 *   and admin‑status flags.
 *
 * Returned shape keeps consumers simple:
 *   { assignments, courses, adminDenied, loading, error }
 */
export function useFetchStatus(userId: string | undefined) {
  const db = firebase.firestore();

  const [assignments, setAssignments] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[] | null>(null);
  const [adminDenied, setAdminDenied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true; // cancellation flag for unmounting

    async function fetchAll() {
      try {
        /* ── 1. Crawl sequential assignment docs  ────────────────────────── */
        const collected: string[] = [];
        let counter = 0;

        while (true) {
          const ref = db
            .collection('assignments')
            .doc(counter === 0 ? userId : `${userId}-${counter}`);
          const snap = await ref.get();

          if (!snap.exists) break;
          const classCodes = snap.data()?.class_codes as string | undefined;
          if (classCodes) collected.push(classCodes);
          counter += 1;
        }

        if (isMounted) setAssignments(collected);

        /* ── 2. Fetch application status doc  ─────────────────────────────── */
        const statusSnap = await db
          .collection('applications')
          .doc(userId)
          .get();
        if (statusSnap.exists && isMounted) {
          const data = statusSnap.data();
          setAdminDenied(data?.status === 'Admin_denied');
          setCourses(data?.courses ?? null);
        }
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { assignments, courses, adminDenied, loading, error } as const;
}
