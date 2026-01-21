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
import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import GetAnnouncementTimestamp from '@/firebase/util/GetAnnouncementTimestamp';
import {
  Announcement,
  Audience,
  AudienceDepartment,
  AudienceRole,
} from '@/types/announcement';
import { Role } from '@/types/User';

type AnnouncementsContextType = {
  read: Announcement[];
  unread: Announcement[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
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

    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
    scheduledAt: toDate(d.scheduledAt),
    expiresAt: toDate(d.expiresAt),

    senderId: d.senderId ?? '',
    senderName: d.senderName ?? null,
    audienceTokens: Array.isArray(d.audienceTokens) ? d.audienceTokens : [],
    channels: Array.isArray(d.channels) ? d.channels : [],
    audience: (d.audience ?? { type: 'all' }) as Audience,

    dispatchStatus: d.dispatchStatus ?? 'unknown',
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
  const [timestamp] = GetAnnouncementTimestamp(user?.uid);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const userEmail = user?.email ?? '';
  const userDepartment: AudienceDepartment = 'ECE';
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
    ].filter(isNonEmpty);

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
        const tMs = a.scheduledAt ?? a.createdAt ?? new Date(Date.now());
        const isUnread = timestamp === null ? true : tMs > timestamp;

        (isUnread ? acc.unread : acc.read).push(a);
        return acc;
      },
      { unread: [] as Announcement[], read: [] as Announcement[] }
    );
  }, [announcements, timestamp]);

  const value = useMemo(
    () => ({
      read,
      unread,
      loading: loading || roleLoading,
      error,
      refresh,
    }),
    [read, unread, loading, roleLoading, error, refresh]
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
