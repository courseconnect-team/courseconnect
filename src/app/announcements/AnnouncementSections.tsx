/* components/DashboardSections.tsx */
import { PrimaryButton } from '@/components/Buttons/PrimaryButton';
import { Role } from '@/types/User';
import { useState } from 'react';

import AnnouncementDialog from './AnnouncementDialogue';
import AnnouncementsRow from './AnnouncementsRow';

import { usePostAnnouncement } from '@/hooks/Announcements/usePostAnnouncement';
import { useAnnouncements } from '@/contexts/AnnouncementsContext';

import { Announcement } from '@/types/announcement';

export default function AnnouncementSections({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const { postAnnouncement, posting, error: postError } = usePostAnnouncement();

  const {
    read,
    unread,
    loading,
    error: fetchError,
    refresh,
  } = useAnnouncements();

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
      {loading ? (
        <div className="p-4 text-sm text-gray-600">Loading announcements…</div>
      ) : fetchError ? (
        <div className="p-4 text-sm text-red-600">
          Failed to load announcements.{' '}
          <button className="underline" onClick={() => refresh()}>
            Retry
          </button>
        </div>
      ) : read.length === 0 && unread.length === 0 ? (
        <div className="p-4 text-sm text-gray-600">No announcements yet.</div>
      ) : (
        <div>
          {unread.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b">
                Unread
              </div>
              {unread.map((a) => (
                <AnnouncementsRow
                  key={a.id}
                  id={a.id!}
                  senderName={a.senderName ?? 'Unknown'}
                  title={a.title}
                  body={a.bodyMd}
                  sendDate={a.createdAt ?? new Date(0)}
                  unread
                />
              ))}
            </>
          )}

          {read.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-t border-b">
                Read
              </div>
              {read.map((a) => (
                <AnnouncementsRow
                  key={a.id}
                  id={a.id!}
                  senderName={a.senderName ?? 'Unknown'}
                  title={a.title}
                  body={a.bodyMd}
                  sendDate={a.createdAt ?? new Date(0)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
