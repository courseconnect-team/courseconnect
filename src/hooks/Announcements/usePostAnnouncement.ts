// usePostAnnouncement.ts
import * as React from 'react';
import firebase from '@/firebase/firebase_config';
import { useUserInfo } from '../User/useGetUserInfo';

type PostAnnouncementArgs = {
  title: string;
  body: string; // markdown
  pin?: boolean;
  scheduledAt?: Date | string | null; // optional
};

export function usePostAnnouncement() {
  const [user, role, loadingUser] = useUserInfo();
  const [posting, setPosting] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  const postAnnouncement = React.useCallback(
    async ({
      title,
      body,
      pin = false,
      scheduledAt = null,
    }: PostAnnouncementArgs) => {
      if (loadingUser) throw new Error('User not loaded yet');
      if (!user?.uid) throw new Error('Not authenticated');
      if (!title.trim() || !body.trim())
        throw new Error('Title and body are required');

      setPosting(true);
      setError(null);
      try {
        const ts = firebase.firestore.FieldValue.serverTimestamp();
        const schedTs = scheduledAt
          ? firebase.firestore.Timestamp.fromDate(
              typeof scheduledAt === 'string'
                ? new Date(scheduledAt)
                : scheduledAt
            )
          : null;

        const docRef = await firebase
          .firestore()
          .collection('announcements')
          .add({
            title,
            bodyMd: body,
            pinned: !!pin,
            createdAt: ts,
            updatedAt: ts,
            scheduledAt: schedTs,
            expiresAt: null,
            senderId: user.uid, // prefer uid; add senderName if you want to show it
            senderName: user.displayName ?? null,
            channels: ['inApp'],
            audience: { type: 'all' }, // simple global audience for now
            dispatchStatus: 'pending', // your fan-out job can flip to 'completed'
          });

        return docRef.id;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setPosting(false);
      }
    },
    [user, loadingUser]
  );

  return { postAnnouncement, posting, error };
}
