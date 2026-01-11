import Link from 'next/link';
import { AnnouncementData } from '@/types/announcement';

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}
type TimestampLike = { seconds: number; nanoseconds: number };

function tsToDate(ts: TimestampLike) {
  const ms = ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1_000_000);
  return new Date(ms);
}
function getDate(d: Date) {
  const dateVariable = tsToDate(d);
  const month = (dateVariable.getMonth() + 1).toString();
  const date = dateVariable.getDate().toString();
  const year = dateVariable.getFullYear();
  return `${month} ${date}, ${year}`;
}

export default function AnnouncementsRow({
  id,
  senderName,
  title,
  body,
  sendDate,
}: AnnouncementData & { id: string }) {
  const initial = getInitial(senderName);
  return (
    <Link
      href={`/announcements/${id}`}
      className="block w-full border-t border-gray-200 bg-white px-6 py-4 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
    >
      <div className="flex items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-white">
            {initial}
          </div>

          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900">{title}</div>
            <div className="text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
              {body}
            </div>
          </div>
        </div>

        <div className="flex-none text-right">
          <div className="text-sm font-semibold text-gray-900">Posted on:</div>
          <div className="text-sm text-gray-500">{getDate(sendDate)}</div>
        </div>
      </div>
    </Link>
  );
}
