'use client';

import { getNavItems } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import PageLayout from '@/components/PageLayout/PageLayout';
import { FC } from 'react';
import AnnouncementSections from './AnnouncementSections';

const AnnouncementsPage: FC = () => {
  const [user, role, loading, error] = useUserInfo();

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading user info</div>;

  return (
    <PageLayout mainTitle="Announcements" navItems={getNavItems(role)}>
      <AnnouncementSections role={role} />
    </PageLayout>
  );
};

export default AnnouncementsPage;
