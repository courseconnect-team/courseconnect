// usePostAnnouncement.ts
import * as React from 'react';
import firebase from '@/firebase/firebase_config';
import { useUserInfo } from '../User/useGetUserInfo';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Announcement, Audience } from '@/types/announcement';

export const ANNOUNCEMENTS_QUERY_KEY = ['announcements'];

/**
 * Chunk an array into groups of `size` — used to batch Firestore `in`
 * queries which cap at 10 values per clause.
 */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/**
 * Count documents matching a query, preferring the Firestore aggregate
 * `count()` API when it's available. Falls back to a full snapshot
 * `.size` read when the compat SDK doesn't expose `.count()`.
 *
 * The `@ts-ignore` below is the one unavoidable suppression in this
 * unit: Firebase compat v11's bundled TypeScript types lag behind the
 * runtime, which does expose `.count()` on Query. This is documented
 * in `firebase-js-sdk` release notes; the runtime call works fine.
 */
async function countQuery(q: firebase.firestore.Query): Promise<number> {
  try {
    // @ts-ignore — compat SDK types don't yet include .count()/Aggregate APIs
    const agg = await (q as any).count().get();
    const n = agg?.data?.().count;
    if (typeof n === 'number') return n;
    // Fall through to snapshot-based count if aggregate returned an
    // unexpected shape.
    const snap = await q.get();
    return snap.size;
  } catch {
    const snap = await q.get();
    return snap.size;
  }
}

/**
 * Resolve a recipient snapshot for the given audience. Returns the
 * count (always) and, for `audience.type === 'users'`, the resolved
 * uids. Throws only on programmer error — any network/permission
 * failure is caught by the caller and treated as a soft fail.
 */
async function resolveRecipientSnapshot(
  audience: Audience
): Promise<{ recipientCount: number; recipientUids?: string[] }> {
  const db = firebase.firestore();
  const usersCol = db.collection('users');

  switch (audience.type) {
    case 'all': {
      const count = await countQuery(usersCol);
      return { recipientCount: count };
    }

    case 'roles': {
      const roles = Array.isArray(audience.roles) ? audience.roles : [];
      if (roles.length === 0) return { recipientCount: 0 };
      // Firestore `in` supports up to 10 values per clause. Our
      // AudienceRole enum only has 3 values, but the chunking keeps
      // this resilient if the enum ever grows.
      let total = 0;
      for (const group of chunk(roles, 10)) {
        const q = usersCol.where('role', 'in', group);
        total += await countQuery(q);
      }
      return { recipientCount: total };
    }

    case 'departments': {
      const departments = Array.isArray(audience.departments)
        ? audience.departments
        : [];
      if (departments.length === 0) return { recipientCount: 0 };
      let total = 0;
      for (const group of chunk(departments, 10)) {
        const q = usersCol.where('department', 'in', group);
        total += await countQuery(q);
      }
      return { recipientCount: total };
    }

    case 'users': {
      const emails = Array.isArray(audience.emails) ? audience.emails : [];
      if (emails.length === 0) {
        return { recipientCount: 0, recipientUids: [] };
      }

      const uids: string[] = [];
      for (const group of chunk(emails, 10)) {
        const snap = await usersCol.where('email', 'in', group).get();
        snap.docs.forEach((doc) => uids.push(doc.id));
      }

      // Deliberately count the ORIGINAL email list, not the resolved
      // uids: an email that doesn't yet resolve to an account is still
      // an intended recipient and should show up in the denominator.
      return {
        recipientCount: emails.length,
        recipientUids: uids,
      };
    }

    default: {
      // Exhaustiveness guard
      return { recipientCount: 0 };
    }
  }
}

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

      // Resolve recipient snapshot. A failure here is non-fatal:
      // the announcement still sends, but with a zero count so the
      // ack panel can gracefully show `Acknowledged (n)` without a
      // denominator.
      let recipientSnapshot: {
        recipientCount: number;
        recipientUids?: string[];
      } = { recipientCount: 0 };
      try {
        recipientSnapshot = await resolveRecipientSnapshot(audience);
      } catch (err) {
        console.error(
          'Failed to snapshot recipient count for announcement; proceeding with 0.',
          err
        );
      }

      const ts = firebase.firestore.FieldValue.serverTimestamp();

      // No backend dispatcher exists to promote `pending` → `completed`,
      // so treat any schedule at-or-before "now" as an immediate send.
      // Only genuinely-future schedules stay pending.
      const scheduledDate = scheduledAt instanceof Date ? scheduledAt : null;
      const isFutureSchedule =
        !!scheduledDate && scheduledDate.getTime() > Date.now();

      const payload: Record<string, any> = {
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
        dispatchStatus: isFutureSchedule ? 'pending' : 'completed',
        recipientCount: recipientSnapshot.recipientCount,
      };

      if (
        audience.type === 'users' &&
        Array.isArray(recipientSnapshot.recipientUids)
      ) {
        payload.recipientUids = recipientSnapshot.recipientUids;
      }

      const docRef = await firebase
        .firestore()
        .collection('announcements')
        .add(payload);

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
