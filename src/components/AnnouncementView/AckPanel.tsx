'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { useAckSummary, AckedUser } from '@/hooks/Announcements/useAckSummary';

type Props = {
  announcementId: string;
  /**
   * The sender-snapshot set of recipient uids — only populated when
   * `audience.type === 'users'`. When present, the panel can show a
   * concrete pending-users list; otherwise it shows a note.
   */
  recipientUids?: string[];
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/** Mirror of the display-name resolver in `useAckSummary` for pending uids. */
async function resolvePendingNames(
  uids: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (uids.length === 0) return out;
  uids.forEach((u) => out.set(u, u));

  const usersCol = firebase.firestore().collection('users');
  const fieldPath = firebase.firestore.FieldPath.documentId();

  for (const group of chunk(uids, 10)) {
    try {
      const snap = await usersCol.where(fieldPath, 'in', group).get();
      snap.docs.forEach((doc) => {
        const d = doc.data() as any;
        const name: string =
          (typeof d?.displayName === 'string' && d.displayName.trim()) ||
          (typeof d?.name === 'string' && d.name.trim()) ||
          (typeof d?.email === 'string' && d.email.trim()) ||
          doc.id;
        out.set(doc.id, name);
      });
    } catch (err) {
      console.error('Failed to resolve pending user display names:', err);
    }
  }

  return out;
}

function formatAckedAt(d: Date | null): string {
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

export default function AckPanel({ announcementId, recipientUids }: Props) {
  const { ackedUsers, total, loading, error, refetch } =
    useAckSummary(announcementId);

  const pendingUids = useMemo(() => {
    if (!Array.isArray(recipientUids)) return null;
    const ackedSet = new Set(ackedUsers.map((a) => a.uid));
    return recipientUids.filter((uid) => !ackedSet.has(uid));
  }, [recipientUids, ackedUsers]);

  const [pendingNames, setPendingNames] = useState<Map<string, string>>(
    () => new Map()
  );
  const [pendingLoading, setPendingLoading] = useState(false);

  useEffect(() => {
    if (!pendingUids || pendingUids.length === 0) {
      setPendingNames(new Map());
      setPendingLoading(false);
      return;
    }
    let cancelled = false;
    setPendingLoading(true);
    resolvePendingNames(pendingUids).then((map) => {
      if (cancelled) return;
      setPendingNames(map);
      setPendingLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [pendingUids]);

  // Header label: include "/ total" only when total is meaningful.
  const headerLabel =
    total && total > 0
      ? `Acknowledged (${ackedUsers.length} / ${total})`
      : `Acknowledged (${ackedUsers.length})`;

  return (
    <Accordion
      data-testid="ack-panel"
      disableGutters
      elevation={0}
      className="rounded-lg border border-gray-200 bg-white"
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="ack-panel-content"
        id="ack-panel-header"
      >
        <span className="text-sm font-semibold text-gray-900">
          {headerLabel}
        </span>
      </AccordionSummary>
      <AccordionDetails>
        {loading && (
          <div className="flex items-center gap-2 py-2 text-sm text-gray-600">
            <CircularProgress size={16} />
            <span>Loading acknowledgments...</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <div>
              Could not load acknowledgments. This can happen if the
              acknowledgments index is still building.
            </div>
            <div>
              <Button size="small" variant="outlined" onClick={refetch}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-5">
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Acknowledged
              </h4>
              {ackedUsers.length === 0 ? (
                <div className="text-sm text-gray-600">
                  No one has acknowledged yet.
                </div>
              ) : (
                <ul
                  data-testid="ack-panel-acknowledged-list"
                  className="flex flex-col gap-1"
                >
                  {ackedUsers.map((u: AckedUser) => (
                    <li
                      key={u.uid}
                      className="flex items-center justify-between text-sm text-gray-800"
                    >
                      <span className="truncate">{u.displayName}</span>
                      <span className="ml-3 shrink-0 text-xs text-gray-500">
                        {formatAckedAt(u.ackedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Pending
              </h4>
              {pendingUids == null ? (
                <div className="text-sm text-gray-600">
                  Pending recipients are not listed for this audience type.
                </div>
              ) : pendingUids.length === 0 ? (
                <div className="text-sm text-gray-600">
                  Everyone has acknowledged.
                </div>
              ) : (
                <ul
                  data-testid="ack-panel-pending-list"
                  className="flex flex-col gap-1"
                >
                  {pendingUids.map((uid) => (
                    <li key={uid} className="text-sm text-gray-800">
                      {pendingLoading ? uid : pendingNames.get(uid) ?? uid}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
