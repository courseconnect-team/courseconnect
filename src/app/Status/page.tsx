'use client';

import { FC } from 'react';
import PageLayout from '@/newcomponents/PageLayout/PageLayout';
import { StatusTable } from '@/newcomponents/StatusTable/StatusTable';
import { useUserInfo } from '@/hooks/useGetUserInfo';
import { useFetchAssignments } from '@/hooks/useFetchApplications';
import { getNavItems } from '@/hooks/useGetItems';

const StatusPage: FC = () => {
  /* 1️⃣  Always call both hooks in the same order */
  const [user, role, userLoading, userError] = useUserInfo();
  const {
    assignments,
    courses,
    adminDenied,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useFetchAssignments(user?.uid); // ok to pass undefined

  /* 2️⃣  Combine loading / error states */
  if (userLoading || assignmentsLoading) return <p>Loading…</p>;
  if (userError) return <p>{userError}</p>;
  if (assignmentsError) return <p>{assignmentsError}</p>;

  /* 3️⃣  Render the layout once everything is loaded */
  return (
    <PageLayout mainTitle="Status" navItems={getNavItems(role)}>
      <StatusTable
        assignments={assignments}
        courses={courses}
        adminDenied={adminDenied}
      />
    </PageLayout>
  );
};

export default StatusPage;
