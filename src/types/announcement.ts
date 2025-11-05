export type AudienceType = 'all' | 'roles' | 'departments' | 'users';

export type AnnouncementDraft = {
  title: string;
  bodyMd: string;
  pinned: boolean;
  requireAck: boolean;
  scheduledAt?: string | null; // ISO local "YYYY-MM-DDTHH:mm"
  expiresAt?: string | null; // ISO local
  channels: boolean;
  audience: {
    type: AudienceType;
    roles?: string[];
    departments?: string[];
    userIds?: string[];
  };
};
