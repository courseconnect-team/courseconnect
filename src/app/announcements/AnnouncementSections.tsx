/* components/DashboardSections.tsx */

import { PrimaryButton } from '@/components/Buttons/PrimaryButton';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { NavbarItem } from '@/types/navigation';
import { Role } from '@/types/User';
import { useState } from 'react';
import AnnouncementDialog from './AnnouncementDialogue';
import { usePostAnnouncement } from '@/hooks/Announcements/usePostAnnouncement';
import { AnnouncementDraft } from '@/types/announcement';
export default function AnnouncementSections({
  role,
  navItems,
}: {
  role: Role;
  navItems: NavbarItem[];
}) {
  const { postAnnouncement, posting, error } = usePostAnnouncement();

  async function handleSubmit(draft: AnnouncementDraft) {
    await postAnnouncement({
      title: draft.title,
      body: draft.bodyMd,
      pin: draft.pinned,
      scheduledAt: draft.scheduledAt ?? null,
    });
    setOpen(false);
  }

  const [open, setOpen] = useState(false);

  function onclose() {
    setOpen(false);
    return;
  }

  const [user] = useUserInfo();

  switch (role) {
    case 'Student':
    case 'student_applied':
    case 'student_applying':
      return <div />;

    case 'faculty':
    case 'admin':
      return (
        <div>
          <PrimaryButton w={170} onClick={() => setOpen(true)}>
            Add Announcement
          </PrimaryButton>
          <AnnouncementDialog
            onClose={onclose}
            onSubmit={handleSubmit}
            open={open}
          />
        </div>
      );

    default:
      return null; // or 404/unauthorised component
  }
}
