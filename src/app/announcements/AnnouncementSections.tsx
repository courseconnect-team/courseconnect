/* components/DashboardSections.tsx */
import { PrimaryButton } from '@/components/Buttons/PrimaryButton';
import { NavbarItem } from '@/types/navigation';
import { Role } from '@/types/User';
import { useMemo, useState } from 'react';

import AnnouncementDialog from './AnnouncementDialogue';
import AnnouncementsRow from './AnnouncementsRow';

import { usePostAnnouncement } from '@/hooks/Announcements/usePostAnnouncement';
import { useFetchAnnouncementsForAccount } from '@/hooks/Announcements/useFetchAnnouncements';

import { Announcement, AudienceRole } from '@/types/announcement';

function convertRole(role: string): AudienceRole | null {
  switch (role) {
    case 'Student':
    case 'student_applied':
    case 'student_applying':
      return 'student';
    case 'admin':
      return 'admin';
    case 'faculty':
      return 'faculty';
    default:
      return null;
  }
}

export default function AnnouncementSections({
  role,
  uemail,
}: {
  role: Role;
  uemail: string;
}) {
  const [open, setOpen] = useState(false);
  const { postAnnouncement, posting, error: postError } = usePostAnnouncement();

  const userRole = useMemo(() => convertRole(role), [role]);

  const {
    announcements,
    loading,
    loadingMore,
    hasMore,
    error: fetchError,
    refresh,
    loadMore,
  } = useFetchAnnouncementsForAccount(
    userRole
      ? {
          userRole,
          userEmail: uemail,
          userDepartment: 'ECE', // TODO: make real
          channel: 'inApp',
          realtime: true,
        }
      : // If role is unknown, still call the hook with safe defaults
        {
          userRole: 'student',
          userEmail: uemail,
          userDepartment: 'ECE',
          channel: 'inApp',
          realtime: true,
        }
  );

  async function handleSubmit(draft: Announcement) {
    await postAnnouncement({
      title: draft.title,
      bodyMd: draft.bodyMd,
      pinned: draft.pinned,
      scheduledAt: draft.scheduledAt,
      requireAck: draft.requireAck,
      expiresAt: draft.expiresAt,
      channels: draft.channels,
      audience: draft.audience,
      audienceTokens: draft.audienceTokens,
    });
    setOpen(false);
    refresh(); // optional: re-fetch after posting
  }

  // View permissions
  const canView =
    role === 'admin' ||
    role === 'faculty' ||
    role === 'Student' ||
    role === 'student_applied' ||
    role === 'student_applying';
  const canCreate = role === 'admin' || role === 'faculty';
  console.log(fetchError);
  if (!canView) return null;
  return (
    <div className="flex flex-col gap-4">
      {canCreate ? (
        <div className="flex items-center gap-3">
          <PrimaryButton w={170} onClick={() => setOpen(true)}>
            Add Announcement
          </PrimaryButton>

          {postError ? (
            <div className="text-sm text-red-600">
              Failed to post: {String(postError)}
            </div>
          ) : null}
        </div>
      ) : null}

      {canCreate ? (
        <AnnouncementDialog
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
          open={open}
          loading={posting}
        />
      ) : null}

      {/* the announcements list stays for everyone who canView */}
      <div className="border rounded-md overflow-hidden bg-white">
        {loading ? (
          <div className="p-4 text-sm text-gray-600">
            Loading announcements…
          </div>
        ) : fetchError ? (
          <div className="p-4 text-sm text-red-600">
            Failed to load announcements.{' '}
            <button className="underline" onClick={() => refresh()}>
              Retry
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">No announcements yet.</div>
        ) : (
          announcements.map((a) => (
            <AnnouncementsRow
              key={a.id}
              id={a.id!}
              senderName={a.senderName ?? 'Unknown'}
              title={a.title}
              body={a.bodyMd}
              sendDate={a.createdAt ?? new Date(0)}
            />
          ))
        )}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <button
            className="px-3 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            onClick={() => loadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
