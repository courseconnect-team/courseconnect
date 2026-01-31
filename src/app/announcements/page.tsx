'use client';

import { getNavItems } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import PageLayout from '@/components/PageLayout/PageLayout';
import { FC, useEffect, useRef } from 'react';
import AnnouncementSections from './AnnouncementSections';
import { markAnnouncementsSeen } from '@/hooks/Announcements/markAnnouncementAsSeen';

const AnnouncementsPage: FC = () => {
  const [user, role, loading, error] = useUserInfo();
  const uemail = user?.email;

  // prevent double-call in dev Strict Mode
  const didMarkRef = useRef(false);

  useEffect(() => {
    if (!user?.uid) return;
    if (didMarkRef.current) return;

    didMarkRef.current = true;
    markAnnouncementsSeen(user.uid).catch(console.error);
  }, [user?.uid]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading user info</div>;

  return (
    <PageLayout mainTitle="Announcements" navItems={getNavItems(role)}>
      <AnnouncementSections role={role} uemail={uemail} />
    </PageLayout>
  );
};

export default AnnouncementsPage;
