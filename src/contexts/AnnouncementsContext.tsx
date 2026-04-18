'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import { Announcement, Audience, AudienceRole } from '@/types/announcement';
import { DEPARTMENTS, isDepartmentMatch } from '@/constants/research';
import { useAnnouncementStates } from '@/hooks/Announcements/useAnnouncementStates';
import {
  markRead as markReadHelper,
  markUnread as markUnreadHelper,
  markAck as markAckHelper,
  markAllRead as markAllReadHelper,
} from '@/hooks/Announcements/markAnnouncementState';

// Resolve a user's stored department string to the short code used in
// announcement audience tokens (e.g. "dept:ece"). Handles the input shapes
// currently in production:
//   1. Short codes stored directly by the signup form (e.g. "ECE", "CS")
//   2. Canonical full names from src/constants/research.ts (e.g.
//      "Electrical and Computer Engineering") — case-insensitive since the
//      profile edit form accepts free-text entry
//   3. The CISE "Science" vs "Sciences" spelling variant, per isDepartmentMatch
// Returns null when the department does not map to any known code; in that
// case the announcements query emits no dept:* token, and the user still
// sees 'all'-targeted + role-targeted + user-targeted announcements.
function resolveDepartmentCode(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  // Short code match (signup dropdown stores labels directly in most users).
  const upper = value.toUpperCase();
  const byLabel = DEPARTMENTS.find((d) => d.label.toUpperCase() === upper);
  if (byLabel) return byLabel.label;

  // Full name match against canonical DEPARTMENTS list (case-insensitive).
  const lower = value.toLowerCase();
  const byFullName = DEPARTMENTS.find((d) => d.value.toLowerCase() === lower);
  if (byFullName) return byFullName.label;

  // CISE spelling variants ("Science" vs "Sciences") both map to CISE.
  if (isDepartmentMatch(value, 'CISE')) return 'CISE';

  // Legacy signup option "CS" maps to the CISE department.
  if (upper === 'CS') return 'CISE';

  return null;
}

type AnnouncementsContextType = {
  read: Announcement[];
  unread: Announcement[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  markRead: (id: string) => Promise<void>;
  markUnread: (id: string) => Promise<void>;
  markAck: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const AnnouncementsContext = createContext<AnnouncementsContextType | null>(
  null
);

function convertRole(role: string): AudienceRole {
  switch (role) {
    case 'admin':
      return 'admin';
    case 'faculty':
      return 'faculty';
    default:
      return 'student';
  }
}

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  return null;
}

function mapDoc(doc: firebase.firestore.QueryDocumentSnapshot): Announcement {
  const d = doc.data() as any;

  return {
    id: doc.id,
    title: d.title ?? '',
    bodyMd: d.bodyMd ?? '',
    pinned: !!d.pinned,
    requireAck: !!d.requireAck,

    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
    scheduledAt: toDate(d.scheduledAt),
    expiresAt: toDate(d.expiresAt),

    senderId: d.senderId ?? '',
    senderName: d.senderName ?? null,
    audienceTokens: Array.isArray(d.audienceTokens) ? d.audienceTokens : [],
    channels:
      d.channels && typeof d.channels === 'object' && !Array.isArray(d.channels)
        ? d.channels
        : {},
    audience: (d.audience ?? { type: 'all' }) as Audience,

    dispatchStatus: d.dispatchStatus ?? 'unknown',

    recipientCount:
      typeof d.recipientCount === 'number' ? d.recipientCount : undefined,
    recipientUids: Array.isArray(d.recipientUids) ? d.recipientUids : undefined,
  };
}

type AnnouncementsProviderProps = {
  children: ReactNode;
};

export function AnnouncementsProvider({
  children,
}: AnnouncementsProviderProps) {
  const { user } = useAuth();
  const [roleData, roleLoading] = GetUserRole(user?.uid);

  const userDocRef = useMemo(() => {
    if (!user?.uid) return null;
    return firebase.firestore().collection('users').doc(user.uid);
  }, [user?.uid]);
  // Cast resolves a type-version mismatch between Firebase compat's
  // DocumentReference<DocumentData> and react-firebase-hooks's expected
  // DocumentReference<DocumentData, DocumentData>. Same issue GetUserRole.js
  // sidesteps by being JS.
  const [userDocSnap] = useDocument(userDocRef as any);

  const { statesById, loading: statesLoading } = useAnnouncementStates(
    user?.uid
  );

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const userEmail = user?.email ?? '';
  const userDepartment = useMemo(
    () => resolveDepartmentCode(userDocSnap?.data()?.department),
    [userDocSnap]
  );
  const channel = 'inApp';

  const userRole = useMemo(() => {
    return convertRole(roleData ?? '');
  }, [roleData]);

  const buildQuery = useCallback(() => {
    const col = firebase.firestore().collection('announcements');
    let q: firebase.firestore.Query = col;

    q = q.where(`channels.${channel}`, '==', true);
    q = q.where('dispatchStatus', '==', 'completed');
    q = q.orderBy('pinned', 'desc').orderBy('createdAt', 'desc');

    if (userRole === 'admin') {
      return q;
    }

    const isNonEmpty = (v: string | null | undefined): v is string =>
      typeof v === 'string' && v.trim().length > 0;

    const norm = (s: string) => s.trim().toLowerCase();

    const tokens = [
      'all',
      userRole ? `role:${norm(userRole)}` : null,
      userRole === 'faculty' ? `role:student` : null,
      userDepartment ? `dept:${norm(userDepartment)}` : null,
      userEmail ? `user:${norm(userEmail)}` : null,
    ].filter(isNonEmpty) as string[];

    q = q.where('audienceTokens', 'array-contains-any', tokens);
    return q;
  }, [userRole, userDepartment, userEmail, channel]);

  useEffect(() => {
    if (roleLoading || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    const q = buildQuery().limit(50);

    const unsub = q.onSnapshot(
      (snap) => {
        const docs = snap.docs;
        const items = docs.map(mapDoc);
        setAnnouncements(items);
        setLoading(false);
      },
      (err) => {
        console.error('Announcements listener error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, [buildQuery, roleLoading, user, refreshTrigger]);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const { read, unread } = useMemo(() => {
    return announcements.reduce(
      (acc, a) => {
        const state = a.id ? statesById.get(a.id) : undefined;
        const isRead = state?.readAt != null;
        const isAcked = state?.ackedAt != null;

        // Partition rule from the plan's High-Level Technical Design:
        //   (requireAck && !acked) → unread
        //   else isRead            → read
        //   else                   → unread
        const bucket: 'read' | 'unread' =
          a.requireAck && !isAcked ? 'unread' : isRead ? 'read' : 'unread';

        acc[bucket].push(a);
        return acc;
      },
      { unread: [] as Announcement[], read: [] as Announcement[] }
    );
  }, [announcements, statesById]);

  const markReadFn = useCallback(
    async (id: string) => {
      if (!user?.uid) return;
      await markReadHelper(user.uid, id);
    },
    [user?.uid]
  );

  const markUnreadFn = useCallback(
    async (id: string) => {
      if (!user?.uid) return;
      await markUnreadHelper(user.uid, id);
    },
    [user?.uid]
  );

  const markAckFn = useCallback(
    async (id: string) => {
      if (!user?.uid) return;
      await markAckHelper(user.uid, id);
    },
    [user?.uid]
  );

  const markAllReadFn = useCallback(async () => {
    if (!user?.uid) return;
    const ids = unread
      .map((a) => a.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    if (ids.length === 0) return;
    await markAllReadHelper(user.uid, ids);
  }, [user?.uid, unread]);

  const value = useMemo(
    () => ({
      read,
      unread,
      loading: loading || roleLoading || statesLoading,
      error,
      refresh,
      markRead: markReadFn,
      markUnread: markUnreadFn,
      markAck: markAckFn,
      markAllRead: markAllReadFn,
    }),
    [
      read,
      unread,
      loading,
      roleLoading,
      statesLoading,
      error,
      refresh,
      markReadFn,
      markUnreadFn,
      markAckFn,
      markAllReadFn,
    ]
  );

  return (
    <AnnouncementsContext.Provider value={value}>
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements(): AnnouncementsContextType {
  const context = useContext(AnnouncementsContext);
  if (!context) {
    throw new Error(
      'useAnnouncements must be used within an AnnouncementsProvider'
    );
  }
  return context;
}
