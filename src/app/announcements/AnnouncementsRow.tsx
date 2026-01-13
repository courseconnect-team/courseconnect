import Link from 'next/link';
import { AnnouncementData } from '@/types/announcement';

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}

type TimestampLike = { seconds: number; nanoseconds: number };

function formatDate(d: Date) {
  const month = (d.getMonth() + 1).toString();
  const date = d.getDate().toString();
  const year = d.getFullYear();
  return `${month} ${date}, ${year}`;
}

type Props = AnnouncementData & { id: string; unread?: boolean };

export default function AnnouncementsRow({
  id,
  senderName,
  title,
  body,
  sendDate,
  unread = false,
}: Props) {
  const initial = getInitial(senderName);

  const base =
    'block w-full border-t border-gray-200 px-6 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400';

  const unreadStyle = 'bg-red-50 hover:bg-red-100'; // subtle highlight
  const readStyle = 'bg-white hover:bg-gray-50';

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

        <div className="flex-none text-right">
          <div className="text-sm font-semibold text-gray-900">Posted on:</div>
          <div className="text-sm text-gray-500">
            {sendDate ? formatDate(sendDate as any) : '—'}
          </div>
        </div>
      </div>
    </Link>
  );
}
