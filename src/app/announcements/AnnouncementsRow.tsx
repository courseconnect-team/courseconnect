import Link from 'next/link';
import { MouseEvent, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MarkEmailReadOutlined from '@mui/icons-material/MarkEmailReadOutlined';
import MarkEmailUnreadOutlined from '@mui/icons-material/MarkEmailUnreadOutlined';
import { AnnouncementData } from '@/types/announcement';

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}

function formatDate(d: Date) {
  const month = (d.getMonth() + 1).toString();
  const date = d.getDate().toString();
  const year = d.getFullYear();
  return `${month} ${date}, ${year}`;
}

type Props = AnnouncementData & {
  id: string;
  unread?: boolean;
  requireAck?: boolean;
  onMarkRead?: (id: string) => Promise<void>;
  onMarkUnread?: (id: string) => Promise<void>;
};

export default function AnnouncementsRow({
  id,
  senderName,
  title,
  body,
  sendDate,
  unread = false,
  requireAck = false,
  onMarkRead,
  onMarkUnread,
}: Props) {
  const initial = getInitial(senderName);
  const [busy, setBusy] = useState(false);

  const base =
    'group relative block w-full border-t border-gray-200 px-6 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400';

  const unreadStyle = 'bg-red-50 hover:bg-red-100'; // subtle highlight
  const readStyle = 'bg-white hover:bg-gray-50';

  // Per-row affordance visibility:
  //   - unread + !requireAck  → show "Mark read" (MarkEmailReadOutlined)
  //   - read                   → show "Mark unread" (MarkEmailUnreadOutlined)
  //   - unread + requireAck    → hide entirely (user must open & acknowledge)
  const showMarkRead = unread && !requireAck && !!onMarkRead;
  const showMarkUnread = !unread && !!onMarkUnread;
  const showToggle = showMarkRead || showMarkUnread;

  const toggleLabel = showMarkRead ? 'Mark as read' : 'Mark as unread';
  const ToggleIcon = showMarkRead
    ? MarkEmailReadOutlined
    : MarkEmailUnreadOutlined;

  const handleToggle = async (e: MouseEvent<HTMLButtonElement>) => {
    // Keep the wrapping <Link> from navigating when the user clicks the
    // icon button inside it.
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    try {
      setBusy(true);
      if (showMarkRead && onMarkRead) {
        await onMarkRead(id);
      } else if (showMarkUnread && onMarkUnread) {
        await onMarkUnread(id);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link
      href={`/announcements/${id}`}
      className={`${base} ${unread ? unreadStyle : readStyle}`}
      aria-label={unread ? `${title} (unread)` : title}
    >
      <div className="flex items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-white">
            {initial}

            {/* red dot */}
            {unread && (
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </div>

          <div className="min-w-0">
            <div
              className={`text-base ${
                unread ? 'font-bold' : 'font-semibold'
              } text-gray-900`}
            >
              {title}
            </div>
            <div
              className={`text-sm overflow-hidden text-ellipsis whitespace-nowrap ${
                unread ? 'text-gray-800' : 'text-gray-600'
              }`}
            >
              {body}
            </div>
          </div>
        </div>

        <div className="flex flex-none items-center gap-3">
          {showToggle && (
            <Tooltip title={toggleLabel} placement="left">
              <IconButton
                aria-label={toggleLabel}
                size="small"
                disabled={busy}
                onClick={handleToggle}
                // Sit above the <Link>'s click target. Hidden by default,
                // revealed on row hover or keyboard focus (including focus
                // landing on the button itself). Always tabbable.
                className="relative z-10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 focus-visible:opacity-100"
              >
                <ToggleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              Posted on:
            </div>
            <div className="text-sm text-gray-500">
              {sendDate ? formatDate(sendDate as any) : '—'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
