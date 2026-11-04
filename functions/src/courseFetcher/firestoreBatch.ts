// Firestore helpers for the persist step.
//
// All writes go through a batch writer with a hard cap so we never exceed
// the 500-op batch limit.

import * as admin from 'firebase-admin';
import type { CancelCheck } from './types';

const BATCH_LIMIT = 450; // leave headroom below the 500-op Firestore limit
const GET_ALL_CHUNK = 300;

export function now(): FirebaseFirestore.FieldValue {
  return admin.firestore.FieldValue.serverTimestamp();
}

export interface BatchWriter {
  // Queue one write on the current batch. The op is only run if the run
  // hasn't been cancelled, so callers pass a function, not the write itself.
  add(op: (batch: FirebaseFirestore.WriteBatch) => void): Promise<void>;
  // Commit whatever is queued, then check for cancellation.
  flush(): Promise<void>;
  readonly cancelled: boolean;
}

export function createBatchWriter(
  db: FirebaseFirestore.Firestore,
  checkCancel?: CancelCheck
): BatchWriter {
  let batch = db.batch();
  let ops = 0;
  let cancelled = false;
  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
    if (checkCancel && (await checkCancel())) {
      cancelled = true;
    }
  };
  const add = async (op: (batch: FirebaseFirestore.WriteBatch) => void) => {
    if (cancelled) return;
    op(batch);
    ops++;
    if (ops >= BATCH_LIMIT) await flush();
  };
  return {
    add,
    flush,
    get cancelled() {
      return cancelled;
    },
  };
}

// db.getAll over any number of refs, keyed by doc id.
export async function getAllInChunks(
  db: FirebaseFirestore.Firestore,
  refs: FirebaseFirestore.DocumentReference[]
): Promise<Map<string, FirebaseFirestore.DocumentSnapshot>> {
  const snaps = new Map<string, FirebaseFirestore.DocumentSnapshot>();
  for (let i = 0; i < refs.length; i += GET_ALL_CHUNK) {
    const chunk = refs.slice(i, i + GET_ALL_CHUNK);
    if (chunk.length === 0) continue;
    for (const snap of await db.getAll(...chunk)) snaps.set(snap.id, snap);
  }
  return snaps;
}
