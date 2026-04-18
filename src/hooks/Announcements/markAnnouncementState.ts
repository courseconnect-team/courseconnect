import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

/**
 * Write helpers for per-(user, announcement) state docs at
 * `users/{uid}/announcementStates/{announcementId}`.
 *
 * Shape: { announcementId, readAt?, ackedAt? }.
 * - `readAt` is set by markRead / markAck / markAllRead
 * - `ackedAt` is set by markAck and implies a concurrent `readAt`
 * - `markUnread` deletes `readAt` while preserving `ackedAt`
 */

const STATE_COLLECTION = 'announcementStates';

// Firestore enforces a limit of 500 writes per batch.
const BATCH_LIMIT = 500;

function stateDocRef(uid: string, announcementId: string) {
  return firebase
    .firestore()
    .collection('users')
    .doc(uid)
    .collection(STATE_COLLECTION)
    .doc(announcementId);
}

/** Mark a single announcement as read for a user. Idempotent. */
export async function markRead(uid: string, id: string): Promise<void> {
  if (!uid || !id) return;
  await stateDocRef(uid, id).set(
    {
      announcementId: id,
      readAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Mark a previously-read announcement as unread. Preserves `ackedAt`.
 *
 * If the state doc does not exist yet, `update` will throw
 * `not-found` — but in that case the item is already effectively
 * unread (no state doc => default-unread), so we swallow that case.
 */
export async function markUnread(uid: string, id: string): Promise<void> {
  if (!uid || !id) return;
  try {
    await stateDocRef(uid, id).update({
      readAt: firebase.firestore.FieldValue.delete(),
    });
  } catch (err: any) {
    // Firestore compat surfaces missing docs as `not-found`; treat
    // that as a no-op since "no state doc" already means unread.
    const code = err?.code ?? err?.message ?? '';
    if (typeof code === 'string' && code.includes('not-found')) {
      return;
    }
    throw err;
  }
}

/**
 * Mark a single announcement as acknowledged. Also sets `readAt`
 * since ack implies read (there is no "unread but acked" state).
 */
export async function markAck(uid: string, id: string): Promise<void> {
  if (!uid || !id) return;
  const ts = firebase.firestore.FieldValue.serverTimestamp();
  await stateDocRef(uid, id).set(
    {
      announcementId: id,
      readAt: ts,
      ackedAt: ts,
    },
    { merge: true }
  );
}

/**
 * Mark every passed announcement id as read in one (or more) batched
 * writes. Splits into multiple batches if `ids.length` exceeds the
 * 500-write Firestore batch limit; commits sequentially.
 */
export async function markAllRead(uid: string, ids: string[]): Promise<void> {
  if (!uid || !Array.isArray(ids) || ids.length === 0) return;

  const db = firebase.firestore();

  for (let start = 0; start < ids.length; start += BATCH_LIMIT) {
    const batch = db.batch();
    const slice = ids.slice(start, start + BATCH_LIMIT);
    for (const id of slice) {
      if (!id) continue;
      batch.set(
        stateDocRef(uid, id),
        {
          announcementId: id,
          readAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    await batch.commit();
  }
}
