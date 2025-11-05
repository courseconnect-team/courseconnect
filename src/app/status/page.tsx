'use client';

import { FC } from 'react';
import PageLayout from '@/components/PageLayout/PageLayout';
import { StatusTable } from '@/components/StatusTable/StatusTable';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { useFetchAssignments } from '@/hooks/Applications/useFetchStudentApplications';
import { getNavItems } from '@/hooks/useGetItems';

const StatusPage: FC = () => {
  const [user, role, userLoading, userError] = useUserInfo();
  const {
    assignments,
    courses,
    adminDenied,
    position,
    dateApplied,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useFetchAssignments(user?.uid); // ok to pass undefined

  if (userLoading || assignmentsLoading) return <p>Loading…</p>;
  if (userError) return <p>{userError}</p>;
  if (assignmentsError) return <p>{assignmentsError}</p>;

  return (
    <PageLayout mainTitle="Status" navItems={getNavItems(role)}>
      {courses ? (
        <StatusTable
          assignments={assignments}
          courses={courses}
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
