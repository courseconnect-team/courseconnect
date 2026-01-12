'use client';
import { useParams } from 'next/navigation';
import { getNavItems } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import PageLayout from '@/components/PageLayout/PageLayout';
import { LinearProgress } from '@mui/material';
import AnnouncementView from '@/components/AnnouncementView/AnnouncementView';
import { useFetchAnnouncementById } from '@/hooks/Announcements/useFetchAnnouncementById';

export default function AnnouncementPage({}: {}) {
  const params = useParams<{ id: string }>();
  const [user, role, loading, roleError] = useUserInfo();
  const {
    data,
    isLoading: appLoading,
    error: appError,
  } = useFetchAnnouncementById(params.id);

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
