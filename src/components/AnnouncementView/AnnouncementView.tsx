import * as React from 'react';
import type firebase from 'firebase/app';
import 'firebase/firestore';
import type { Announcement } from '@/types/announcement';

type TimestampLike =
  | Date
  | { seconds: number; nanoseconds: number }
  | null
  | undefined;

function getInitial(name: string | null | undefined) {
  const trimmed = (name ?? '').trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}

function toJsDate(v: TimestampLike): Date | null {
  if (!v) return null;

  if (v instanceof Date) return v;

  // Firestore Timestamp (compat) has toDate()
  if (typeof (v as any).toDate === 'function') return (v as any).toDate();

  // Serialized timestamp-like {seconds, nanoseconds}
  if (typeof (v as any).seconds === 'number') {
    const ts = v as { seconds: number; nanoseconds: number };
    const ms = ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1_000_000);
    return new Date(ms);
  }

  return null;
}

function formatPostedAt(v: TimestampLike) {
  const d = toJsDate(v);
  if (!d) return '';

  const datePart = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(d);

  const timePart = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);

  return `Posted on ${datePart} at ${timePart}`;
}

type Props = {
  announcement: Announcement;
};

export default function AnnouncementView({ announcement }: Props) {
  const initial = getInitial(announcement.senderName);
  const postedLine = formatPostedAt(announcement.createdAt);

  return (
    <div className="w-full">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
              {initial}
            </div>

            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">
                {announcement.senderName ?? 'Unknown'}
              </div>
              <div className="text-xs text-gray-500">{postedLine}</div>
            </div>
          </div>

          {/* Title */}
          <div className="mt-5 text-3xl font-bold text-gray-900">
            {announcement.title}
          </div>

          {/* Body */}
          <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {announcement.bodyMd}
          </div>
        </div>
      </div>
    </div>
  );
}
