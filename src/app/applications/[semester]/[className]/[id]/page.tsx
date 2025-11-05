'use client';

import { LinearProgress } from '@mui/material';
import PageLayout from '@/components/PageLayout/PageLayout';
import { ApplicationPreview } from '@/components/ApplicationPreview/ApplicationPreview';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { useFetchApplicationById } from '@/hooks/Applications/useFetchApplicationById';
import { getNavItems } from '@/hooks/useGetItems';
import { useParams } from 'next/navigation';

export default function ApplicationPage({}: {}) {
  const params = useParams<{ id: string; className: string }>();
  const [user, role, loading, roleError] = useUserInfo();

  const canView = role === 'faculty' || role === 'admin';
  const canQuery = Boolean(params.id) && canView && !loading && !roleError;
  const cleanClassName = decodeURIComponent(params.className).trim();
  // Always call the hook; let `enabled` control execution
  const {
    data,
    isLoading: appLoading,
    error: appError,
  } = useFetchApplicationById(params.id, {
    enabled: canQuery,
    staleTime: 5 * 60_000,
  });

  // Now only conditional rendering (no more hooks below)

  if (loading || appLoading) return <LinearProgress />;

  if (appError) {
    return <PageLayout mainTitle="Error" navItems={getNavItems(role)} />;
  }

  if (!data) {
    return (
      <PageLayout
        mainTitle="Application not found"
        navItems={getNavItems(role)}
      />
    );
  }
  if (!canView) return <p>Not authorized.</p>;
  if (roleError) return <p>Error loading role</p>;
  if (!user) return <p>Please sign in.</p>;
  return (
    <PageLayout mainTitle={cleanClassName} navItems={getNavItems(role)}>
      <ApplicationPreview
        documentId={params.id}
        data={data}
        courseId={cleanClassName}
      />
    </PageLayout>
  );
}
