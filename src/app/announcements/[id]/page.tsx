'use client';
import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getNavItems } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import PageLayout from '@/components/PageLayout/PageLayout';
import { LinearProgress } from '@mui/material';
import AnnouncementView from '@/components/AnnouncementView/AnnouncementView';
import { useFetchAnnouncementById } from '@/hooks/Announcements/useFetchAnnouncementById';
import { useAnnouncements } from '@/contexts/AnnouncementsContext';

export default function AnnouncementPage({}: {}) {
  const params = useParams<{ id: string }>();
  const [user, role, loading, roleError] = useUserInfo();
  const {
    data,
    isLoading: appLoading,
    error: appError,
  } = useFetchAnnouncementById(params.id);

  const { markRead } = useAnnouncements();

  // Guard against React Strict Mode's double-invoke in dev and against
  // re-firing when unrelated deps change.
  const didMarkRef = useRef(false);

  useEffect(() => {
    if (!user?.uid) return;
    if (!params?.id) return;
    if (didMarkRef.current) return;

    didMarkRef.current = true;
    markRead(params.id).catch((err) => {
      console.error('Failed to mark announcement as read:', err);
      toast.error('Could not mark this announcement as read.');
    });
  }, [user?.uid, params?.id, markRead]);

  if (loading || appLoading) return <LinearProgress />;
  if (appError || !data) {
    return <PageLayout mainTitle="Error" navItems={getNavItems(role)} />;
  }

  return (
    <PageLayout navItems={getNavItems(role)}>
      <AnnouncementView announcement={data} />
    </PageLayout>
  );
}
