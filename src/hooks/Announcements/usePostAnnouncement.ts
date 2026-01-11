// usePostAnnouncement.ts
import * as React from 'react';
import firebase from '@/firebase/firebase_config';
import { useUserInfo } from '../User/useGetUserInfo';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Announcement } from '@/types/announcement';

export const ANNOUNCEMENTS_QUERY_KEY = ['announcements'];

export function usePostAnnouncement() {
  const [user, role, loadingUser] = useUserInfo();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ['postAnnouncement'],
    mutationFn: async ({
      title,
      bodyMd,
      pinned = false,
      scheduledAt,
      requireAck,
      expiresAt,
      channels,
      audience,
      audienceTokens,
    }: Announcement) => {
      if (loadingUser) throw new Error('User not loaded yet');
      if (!user?.uid) throw new Error('Not authenticated');
      if (!title.trim() || !bodyMd.trim())
        throw new Error('Title and body are required');

      const ts = firebase.firestore.FieldValue.serverTimestamp();
      const docRef = await firebase
        .firestore()
        .collection('announcements')
        .add({
          title,
          bodyMd: bodyMd,
          pinned: !!pinned,
          createdAt: ts,
          updatedAt: ts,
          scheduledAt: scheduledAt,
          expiresAt: expiresAt,
          senderId: user.uid,
          senderName: user.displayName ?? null,
          channels: channels,
          audience: audience,
          audienceTokens: audienceTokens,
          requireAck: requireAck,
          dispatchStatus: scheduledAt ? 'pending' : 'completed',
        });

      return docRef.id;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ANNOUNCEMENTS_QUERY_KEY,
      });
    },
  });

  return {
    postAnnouncement: mutation.mutateAsync,
    posting: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
