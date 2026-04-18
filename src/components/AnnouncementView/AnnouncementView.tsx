'use client';

import * as React from 'react';
import { useState } from 'react';
import type firebase from 'firebase/app';
import 'firebase/firestore';
import toast from 'react-hot-toast';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Announcement } from '@/types/announcement';
import AckPanel from './AckPanel';

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

function formatDateTime(v: TimestampLike) {
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

  return `${datePart} at ${timePart}`;
}

function formatPostedAt(v: TimestampLike) {
  const formatted = formatDateTime(v);
  return formatted ? `Posted on ${formatted}` : '';
}

type Props = {
  announcement: Announcement;
  /**
   * The current user's ack timestamp for this announcement, if any.
   * Only meaningful when `announcement.requireAck === true`.
   */
  ackedAt?: Date | null;
  /**
   * Callback invoked when the user clicks "I acknowledge". The caller
   * is responsible for wiring this to `markAck(id)` from the
   * `useAnnouncements()` context.
   */
  onAcknowledge?: () => Promise<void>;
  /**
   * The current viewer's uid — used (with `viewerRole`) to decide
   * whether to render the sender-side ack dashboard panel.
   */
  viewerUid?: string;
  /**
   * The current viewer's role. Admins always see the ack panel on
   * requireAck items; other roles only see it when they match the
   * announcement's `senderId`.
   */
  viewerRole?: string;
};

export default function AnnouncementView({
  announcement,
  ackedAt,
  onAcknowledge,
  viewerUid,
  viewerRole,
}: Props) {
  const initial = getInitial(announcement.senderName);
  const postedLine = formatPostedAt(announcement.createdAt);

  const [busy, setBusy] = useState(false);

  const requireAck = announcement.requireAck === true;
  const isAcked = ackedAt != null;

  // Sender-side ack panel is visible to the announcement's sender
  // and to any admin — but only when the announcement actually
  // requires acknowledgment. Faculty who are NOT the sender do not
  // see another sender's ack status.
  const canSeeAckPanel =
    requireAck &&
    typeof announcement.id === 'string' &&
    announcement.id.length > 0 &&
    (viewerRole === 'admin' ||
      (typeof viewerUid === 'string' &&
        viewerUid.length > 0 &&
        viewerUid === announcement.senderId));

  const handleAcknowledge = async () => {
    if (!onAcknowledge || busy) return;
    setBusy(true);
    try {
      await onAcknowledge();
    } catch (err) {
      console.error('Failed to acknowledge announcement:', err);
      toast.error('Could not acknowledge this announcement. Please try again.');
    } finally {
      setBusy(false);
    }
  };

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

          {/* Sender-side ack panel — only rendered when the viewer
              is the sender or an admin AND the announcement is
              requireAck. Sits above the ack footer, below the body. */}
          {canSeeAckPanel && (
            <>
              <Divider className="my-6" />
              <AckPanel
                announcementId={announcement.id as string}
                recipientUids={announcement.recipientUids}
              />
            </>
          )}
        </div>

        {/* Ack footer — only rendered for requireAck items. */}
        {requireAck && (
          <div className="sticky bottom-0 rounded-b-xl border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur">
            {isAcked ? (
              <div
                data-testid="ack-confirmation"
                className="flex items-center gap-2 text-sm font-medium text-green-700"
              >
                <CheckCircleIcon fontSize="small" />
                <span>{`Acknowledged on ${formatDateTime(ackedAt)}`}</span>
              </div>
            ) : (
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-700">
                  This announcement requires your acknowledgment.
                </div>
                <Button
                  data-testid="ack-button"
                  variant="contained"
                  color="primary"
                  disabled={busy || !onAcknowledge}
                  onClick={handleAcknowledge}
                  startIcon={
                    busy ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : undefined
                  }
                  className="w-full sm:w-auto"
                >
                  {busy ? 'Acknowledging...' : 'I acknowledge'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
