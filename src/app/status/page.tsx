'use client';

import { FC } from 'react';
import PageLayout from '@/components/PageLayout/PageLayout';
import { StatusTable } from '@/components/StatusTable/StatusTable';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { useFetchAssignments } from '@/hooks/Applications/useFetchStudentApplications';
import { useStudentResearchApplications } from '@/hooks/Research/useStudentResearchApplications';

const StatusPage: FC = () => {
  const [user, , userLoading, userError] = useUserInfo();
  const {
    assignments,
    courses,
    adminDenied,
    position,
    dateApplied,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useFetchAssignments(user?.uid); // ok to pass undefined
  const { data: researchApplications = [], isLoading: researchLoading } =
    useStudentResearchApplications(user?.uid);

  if (userLoading || assignmentsLoading || researchLoading)
    return <p>Loading…</p>;
  if (userError) return <p>{userError}</p>;
  if (assignmentsError) return <p>{assignmentsError}</p>;

  return (
    <PageLayout mainTitle="Status">
      {courses || researchApplications.length > 0 ? (
        <StatusTable
          assignments={assignments}
          courses={courses}
          researchApplications={researchApplications}
          adminDenied={adminDenied}
          position={position}
          dateApplied={dateApplied}
        />
      ) : (
        <p>You have no applications or assignments at this time.</p>
      )}
    </PageLayout>
  );
};

export default StatusPage;
