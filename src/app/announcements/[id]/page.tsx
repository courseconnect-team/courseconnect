'use client';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getNavItems } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import PageLayout from '@/components/PageLayout/PageLayout';
import { LinearProgress } from '@mui/material';
import AnnouncementView from '@/components/AnnouncementView/AnnouncementView';
import { useFetchAnnouncementById } from '@/hooks/Announcements/useFetchAnnouncementById';
import { useAnnouncements } from '@/contexts/AnnouncementsContext';
import { useAnnouncementStates } from '@/hooks/Announcements/useAnnouncementStates';

export default function AnnouncementPage({}: {}) {
  const params = useParams<{ id: string }>();
  const [user, role, loading, roleError] = useUserInfo();
  const {
    data,
    isLoading: appLoading,
    error: appError,
  } = useFetchAnnouncementById(params.id);

  const { markRead, markAck } = useAnnouncements();

  // Live subscription to the current user's announcement-state docs so
  // we can render the correct ack state on the detail view (the
  // context uses this same hook internally; sharing it does not add a
  // second Firestore listener — Firestore dedupes listeners on the
  // same ref, but either way the cost is trivial for a per-user query).
  const { statesById } = useAnnouncementStates(user?.uid);
  const state = params?.id ? statesById.get(params.id) : undefined;

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

  const onAcknowledge = useCallback(async () => {
    if (!params?.id) return;
    await markAck(params.id);
  }, [markAck, params?.id]);

  if (loading || appLoading) return <LinearProgress />;
  if (appError || !data) {
    return <PageLayout mainTitle="Error" navItems={getNavItems(role)} />;
  }

  return (
    <PageLayout navItems={getNavItems(role)}>
      <AnnouncementView
        announcement={data}
        ackedAt={state?.ackedAt ?? null}
        onAcknowledge={onAcknowledge}
      />
    </PageLayout>
  );
}
