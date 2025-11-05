'use client';

import { getNavItems, getCourses } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import PageLayout from '@/components/PageLayout/PageLayout';
import { FC, useEffect, useState } from 'react';
import AnnouncementSections from './AnnouncementSections';

interface pageProps {}
const AnnouncementsPage: FC<pageProps> = () => {
  const [user, role, loading, error] = useUserInfo();
  const uemail = user?.email;

  // ② handle loading / error
  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading user info</div>;
  if (role !== 'faculty' && role !== 'admin') return <div> Inaccessible </div>;
  return (
    <PageLayout mainTitle="Announcements" navItems={getNavItems(role)}>
      <AnnouncementSections role={role} navItems={getCourses(role)} />
    </PageLayout>
  );
};
export default AnnouncementsPage;
