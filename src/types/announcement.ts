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

  channels?: {};

  dispatchStatus?: string;

  audience: Audience;
  audienceTokens: string[];
};

export type AnnouncementData = {
  id: string;
  title: string;
  body: string;
  sendDate: Date;
  senderName: string;
};
