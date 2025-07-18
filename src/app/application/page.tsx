'use client';

import { getNavItems, getApplications } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/useGetUserInfo';
import PageLayout from '@/newcomponents/PageLayout/PageLayout';
import { FC, useEffect, useState } from 'react';
import ApplicationSections from './applicationSections';
import Application from '../Apply/inacessible';

interface pageProps {}
const ApplicationPage: FC<pageProps> = () => {
  const [user, role, loading, error] = useUserInfo();

  // ② handle loading / error
  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading user info</div>;

  return (
    <PageLayout mainTitle="Applications" navItems={getNavItems(role)}>
      <ApplicationSections role={role} navItems={getApplications(role)} />
    </PageLayout>
  );
};
export default ApplicationPage;
