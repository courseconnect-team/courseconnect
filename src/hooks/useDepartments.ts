'use client';

import { useEffect, useMemo, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { Department, DepartmentStatus } from '@/types/department';

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  return null;
}

function mapDoc(doc: firebase.firestore.QueryDocumentSnapshot): Department {
  const d = doc.data() as any;
  const status: DepartmentStatus =
    d.status === 'archived' ? 'archived' : 'active';
  return {
    id: doc.id,
    code: typeof d.code === 'string' ? d.code : '',
    name: typeof d.name === 'string' ? d.name : '',
    status,
    createdAt: toDate(d.createdAt),
    archivedAt: toDate(d.archivedAt),
  };
}

type UseDepartmentsOptions = {
  // 'active' (default) hides archived. 'all' returns both.
  include?: 'active' | 'all';
};

type UseDepartmentsResult = {
  departments: Department[];
  byId: Map<string, Department>;
  loading: boolean;
  error: Error | null;
};

// Subscribes to the departments collection and returns a hydrated list.
// Client reads are permitted for any authenticated user under the Unit 1
// baseline rules; Unit 7 will tighten reads if needed.
export function useDepartments(
  options: UseDepartmentsOptions = {}
): UseDepartmentsResult {
  const include = options.include ?? 'active';
  const [all, setAll] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const col = firebase.firestore().collection('departments');
    const unsub = col.orderBy('code').onSnapshot(
      (snap) => {
        setAll(snap.docs.map(mapDoc));
        setLoading(false);
      },
      (err) => {
        console.error('useDepartments listener error:', err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const departments = useMemo(() => {
    if (include === 'all') return all;
    return all.filter((d) => d.status === 'active');
  }, [all, include]);

  const byId = useMemo(() => {
    const m = new Map<string, Department>();
    for (const d of all) m.set(d.id, d);
    return m;
  }, [all]);

  return { departments, byId, loading, error };
}

// Convenience lookup that avoids a subscription when the caller only needs to
// resolve an id once and already has the hydrated list.
export function findDepartmentById(
  departments: Department[],
  id: string | null | undefined
): Department | null {
  if (!id) return null;
  return departments.find((d) => d.id === id) ?? null;
}
