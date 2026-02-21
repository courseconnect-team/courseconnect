import {
  collection,
  query,
  where,
  getDocs,
  getFirestore,
} from 'firebase/firestore';
import {
  useQuery,
  keepPreviousData,
  type UseQueryResult,
} from '@tanstack/react-query';
import { ApplicationData, AppRow } from '@/types/query';
import { ApplicationRepository } from '@/firebase/applications/applicationRepository';

export type ByStatus = Record<string, AppRow[]>;

export const ALL_APP_STATUSES = [
  'applied',
  'approved',
  'denied',
  'accepted',
] as const;
const ASSIGNED = 'assigned';

// unified query key helper so single- vs multi-status share cache
const appsKey = (courseKey: string, statuses: string[]) =>
  ['courseAppsByCourse', courseKey, ...[...statuses].sort()] as const;

const db = getFirestore();
const repo = new ApplicationRepository(db);

// ---------- Low-level fetchers ----------
/** Applications: courses[courseKey] IN statuses */
async function fetchApplicationsForCourse(
  courseKey: string,
  statuses: string[]
): Promise<AppRow[]> {
  if (!statuses.length) return [];

  const applications = await repo.getApplicationsForCourse(courseKey, statuses);
  const appRows: AppRow[] = applications.map((app) => ({
    id: app.id!,
    status: app.courses?.[courseKey] || 'applied',
    data: app,
  }));

  return appRows;
}

async function fetchAssignedForCourse(courseKey: string): Promise<AppRow[]> {
  const q = query(
    collection(db, 'assignments'),
    where('class_codes', '==', courseKey)
  );
  const snap = await getDocs(q);
  const out: AppRow[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as ApplicationData;
    out.push({ id: doc.id, status: ASSIGNED, data });
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
  // normalize the requested statuses
  const wantAssigned = statuses.includes(ASSIGNED);
  const appStatuses = statuses.filter((s) => s !== ASSIGNED);
  const key = appsKey(courseKey, statuses);

  return useQuery<
    AppRow[],
    Error,
    { all: AppRow[]; byStatus: ByStatus; counts: Record<string, number> }
  >({
    queryKey: key,
    enabled: enabled && !!courseKey && statuses.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,

    // fetch apps (selected statuses) + assignments (if requested)
    queryFn: async () => {
      const [apps, assigned] = await Promise.all([
        appStatuses.length
          ? fetchApplicationsForCourse(courseKey, appStatuses)
          : Promise.resolve<AppRow[]>([]),
        wantAssigned
          ? fetchAssignedForCourse(courseKey)
          : Promise.resolve<AppRow[]>([]),
      ]);
      return [...apps, ...assigned];
    },

    // group + counts for consumers
    select: (rows) => {
      const by: ByStatus = {};
      for (const r of rows) (by[r.status] ??= []).push(r);

      const counts: Record<string, number> = {};
      for (const s of statuses) counts[s] = by[s]?.length ?? 0;

      // ensure deterministic order inside each status (optional)
      for (const s of Object.keys(by))
        by[s].sort((a, b) => a.id.localeCompare(b.id));

      return { all: rows, byStatus: by, counts };
    },
  });
}

export function useCourseApplicationsByStatus(
  courseKey: string,
  status: string,
  enabled = true
): UseQueryResult<AppRow[], Error> {
  return useQuery<AppRow[], Error>({
    queryKey: appsKey(courseKey, [status]),
    enabled: enabled && !!courseKey && !!status,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: () =>
      status === ASSIGNED
        ? fetchAssignedForCourse(courseKey)
        : fetchApplicationsForCourse(courseKey, [status]),
  });
}
