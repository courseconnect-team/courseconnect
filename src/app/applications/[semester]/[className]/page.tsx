'use client';
import { FC, useMemo, useState } from 'react';
import PageLayout from '@/components/PageLayout/PageLayout';
import { getNavItems } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import {
  useParams,
  useSearchParams,
  useRouter,
  usePathname,
} from 'next/navigation';
import ApplicationStatusFilter from '@/components/ApplicationStatusFilter/ApplicationStatusFilter';
import { useCourseApplications } from '@/hooks/Applications/useFetchApplications';
import { LinearProgress } from '@mui/material';
import { AppRow, ApplicationStatus, StatusFilter } from '@/types/query';
import { CourseApplicationsTable } from '@/components/ApplicationsTable/ApplicationsTable';
import { ApplicationModal } from '../ApplicationsModal';
import { useFetchApplicationById } from '@/hooks/Applications/useFetchApplicationById';
import { SemesterName } from '@/hooks/useSemesterOptions';
import { addSemesterToCourseDoc } from '@/hooks/Applications/ApplicationFunctions';

const ApplicationsPage: FC = () => {
  const [user, role, loading, roleError] = useUserInfo();
  const params = useParams<{ semester: SemesterName; className: string }>();
  const rawId = params.className;
  const semester = params.semester;

  const semesterId = decodeURIComponent(semester);
  const courseId = decodeURIComponent(rawId);
  const statuses = ['applied', 'approved', 'denied', 'accepted'];

  const legacyCourseId = addSemesterToCourseDoc(courseId, semesterId);
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const id = search.get('id');
  const modal = search.get('modal') === '1';

  const { data, isLoading, isFetching, error } = useCourseApplications(
    legacyCourseId,
    statuses
  );

  console.log(legacyCourseId);
  const rows = data?.all ?? [];

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const selectedRow = useMemo<AppRow | null>(
    () => (id ? rows.find((r) => r.id === id) ?? null : null),
    [id, rows]
  );

  const { data: hydratedDoc } = useFetchApplicationById(id ?? '', {
    enabled: Boolean(id && !selectedRow),
    initialData: selectedRow?.data ?? undefined,
    staleTime: 5 * 60 * 1000,
  });

  const courseStatus = useMemo<ApplicationStatus | undefined>(() => {
    if (selectedRow) return selectedRow.status as ApplicationStatus | undefined;

    // Fallback: compute from the hydrated doc’s courses map
    const courses = (hydratedDoc as any)?.courses as
      | Record<string, ApplicationStatus>
      | undefined;
    return courses?.[courseId];
  }, [selectedRow, hydratedDoc, courseId]);

  const close = () => {
    const params = new URLSearchParams(search.toString());
    params.delete('id');
    params.delete('modal');
    router.replace(params.toString() ? `${pathname}?${params}` : pathname, {
      scroll: false,
    });
  };

  if (roleError) return <p>Error loading role</p>;
  if (!user) return <p>Please sign in.</p>;
  if (role !== 'faculty' && role !== 'admin') return <p>Not authorized.</p>;

  if (isLoading || loading || isFetching) return <LinearProgress />;
  if (error || roleError)
    return <PageLayout mainTitle="Error" navItems={getNavItems(role)} />;

  if (!data)
    return (
      <PageLayout mainTitle="Course not Found" navItems={getNavItems(role)} />
    );
  return (
    <PageLayout
      mainTitle={`${courseId} - ${semesterId}`}
      navItems={getNavItems(role)}
    >
      <div className="mb-6">
        <ApplicationStatusFilter
          applicationState={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <CourseApplicationsTable
        rows={data?.all}
        semester={semesterId}
        selectedFilter={statusFilter}
        courseId={courseId}
        loading={isLoading}
      />
      {modal && id && (
        <ApplicationModal
          open={Boolean(modal && id)}
          courseId={courseId}
          id={id ?? ''}
          onClose={close}
          parentPath={pathname}
          documentData={hydratedDoc ?? undefined}
          documentStatus={courseStatus}
        />
      )}
    </PageLayout>
  );
};
export default ApplicationsPage;
