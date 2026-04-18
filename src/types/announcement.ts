export type AudienceType = 'all' | 'roles' | 'departments' | 'users';
export type AudienceDepartment = 'ECE' | 'CISE' | 'MAE';
export type AudienceRole = 'admin' | 'faculty' | 'student';

export type Audience =
  | { type: 'all' }
  | { type: 'roles'; roles: AudienceRole[] }
  | { type: 'departments'; departments: AudienceDepartment[] }
  | { type: 'users'; emails: string[] };

export type Announcement = {
  id?: string;

  title: string;
  bodyMd: string;

  pinned?: boolean;
  requireAck?: boolean;

  createdAt?: Date | null;
  updatedAt?: Date | null;
  scheduledAt?: Date | null;
  expiresAt?: Date | null;

  senderId?: string;
  senderName?: string | null;

  channels?: { inApp?: boolean; email?: boolean };

  dispatchStatus?: string;

  audience: Audience;
  audienceTokens: string[];

  // Snapshot of recipient count at send time (Unit 4). Optional for
  // backwards compatibility with announcements written before the
  // overhaul; readers should treat `undefined` as "unknown".
  recipientCount?: number;
  // Only populated when `audience.type === 'users'` — the resolved
  // uids for those recipients, used by the sender-side ack dashboard.
  recipientUids?: string[];
};

/**
 * Per-(user, announcement) state. Stored at
 * `users/{uid}/announcementStates/{announcementId}`.
 *
 * Absence of a doc means "unread, not acknowledged".
 */
export type AnnouncementState = {
  announcementId: string;
  readAt?: Date | null;
  ackedAt?: Date | null;
};

export type AnnouncementData = {
  id: string;
  title: string;
  body: string;
  sendDate: Date;
  senderName: string;
};
