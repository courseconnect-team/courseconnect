'use client';

import SideNav from '@/components/SideNavBar/SideNavBar';
import TopNav from '@/components/TopBar/TopBar';
import { getNavItems } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import DashboardSections from './DashboardSections';
import PageLayout from '@/components/PageLayout/PageLayout';
import { FC, useEffect, useState } from 'react';
interface pageProps {}
const NewDashboard: FC<pageProps> = () => {
  const [user, role, loading, error] = useUserInfo();

  // ② handle loading / error
  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading user info</div>;

  return (
    <PageLayout mainTitle="Dashboard" navItems={getNavItems(role)}>
      <DashboardSections navItems={getNavItems(role)} role={role} />
    </PageLayout>
  );
};
export default NewDashboard;
