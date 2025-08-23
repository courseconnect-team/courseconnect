import * as React from 'react';
import {
  collection, query, where, getDocs, FieldPath, type Firestore,
} from 'firebase/firestore';
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
  type UseQueryResult,
} from '@tanstack/react-query';
import firebase from '@/firebase/firebase_config';
import { ALL } from 'dns';

export type AppRow = {
  id: string; // document id
  status: string; // 'applied' | 'approved' | 'assigned' | ...
  source: 'applications' | 'assignments';
  data: Record<string, any>; // full doc if you need more fields
};
export type ByStatus = Record<string, AppRow[]>;

export const ALL_APP_STATUSES = [
  'applied',
  'approved',
  'denied',
  'Admin_denied',
] as const;
const ASSIGNED = 'assigned';

// unified query key helper so single- vs multi-status share cache
const appsKey = (courseKey: string, statuses: string[]) =>
  ['courseAppsByCourse', courseKey, ...[...statuses].sort()] as const;

const db = firebase.firestore();
// ---------- Low-level fetchers ----------
/** Applications: courses[courseKey] IN statuses */
async function fetchApplicationsForCourse(
  courseKey: string,
  statuses: string[]
): Promise<AppRow[]> {
  if (!statuses.length) return [];
  const field = new FieldPath('courses', courseKey);

  // Firestore 'in' supports up to 10 values; chunk if needed
  const chunks: string[][] = [];
  for (let i = 0; i < statuses.length; i += 10)
    chunks.push(statuses.slice(i, i + 10));

  const batches = await Promise.all(
    chunks.map(async (stk) => {
      const q = query(collection(db, 'applications'), where(field, 'in', stk));
      const snap = await getDocs(q);
      const out: AppRow[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as Record<string, any>;
        out.push({
          id: doc.id,
          status: data?.courses?.[courseKey],
          source: 'applications',
          data,
        });
      });
      return out;
    })
  );

  const seen = new Set<string>();
  const merged: AppRow[] = [];
  for (const arr of batches) {
    for (const r of arr) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        merged.push(r);
      }
    }
  }
  return merged;
}

async function fetchAssignedForCourse(courseKey: string): Promise<AppRow[]> {
  const q = query(
    collection(db, 'assignments'),
    where('class_codes', '==', courseKey)
  );
  const snap = await getDocs(q);
  const out: AppRow[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as Record<string, any>;
    out.push({ id: doc.id, status: ASSIGNED, source: 'assignments', data });
  });
  return out;
}

export function useCourseApplications(
  courseKey: string,
  statuses: string[] = [...ALL_APP_STATUSES, ASSIGNED],
  enabled = true
): UseQueryResult<
  { all: AppRow[]; byStatus: ByStatus; counts: Record<string, number> },
  Error
> {
    const db = firebase.firestore() as unknown as Firestore;
    const qc = useQueryClient();
    
}
