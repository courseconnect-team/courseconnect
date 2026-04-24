// Course-fetch HTTP endpoints + scheduled refresh.
//
// All HTTPS endpoints follow the existing project convention: POST-only JSON,
// bearer-token auth via verifyAuth, admin-only via an inline role check.

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import type { Request, Response } from 'express';
import {
  asRecord,
  db,
  fail,
  getRole,
  handleMethod,
  readString,
  setCors,
  verifyAuth,
} from './index';
import { runAndPersist } from './courseFetcher/runner';
import {
  computeNextRefreshAt,
  validateConfigInput,
  type ValidatedConfig,
} from './courseFetcher/validation';

async function ensureAdmin(uid: string, res: Response): Promise<boolean> {
  const role = await getRole(uid);
  if (role !== 'admin') {
    res.status(403).json({ message: 'Forbidden — admin only' });
    return false;
  }
  return true;
}

function now(): FirebaseFirestore.FieldValue {
  return admin.firestore.FieldValue.serverTimestamp();
}

function configFromDoc(
  snap: FirebaseFirestore.DocumentSnapshot
): Record<string, unknown> | null {
  if (!snap.exists) return null;
  const data = snap.data() ?? {};
  return { id: snap.id, ...data };
}

// --- CRUD ---

export const listCourseFetchConfigs = functions.https.onRequest(
  async (req: Request, res: Response) => {
    setCors(req, res);
    if (!handleMethod(req, res)) return;
    const caller = await verifyAuth(req, res);
    if (!caller) return;
    if (!(await ensureAdmin(caller.uid, res))) return;

    try {
      const snap = await db
        .collection('courseFetchConfigs')
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
      const configs = snap.docs.map((d) => configFromDoc(d)).filter(Boolean);
      res.status(200).json({ configs });
    } catch (error) {
      console.error('listCourseFetchConfigs failed:', error);
      fail(res, 'Failed to list configs', 500);
    }
  }
);

export const createCourseFetchConfig = functions.https.onRequest(
  async (req: Request, res: Response) => {
    setCors(req, res);
    if (!handleMethod(req, res)) return;
    const caller = await verifyAuth(req, res);
    if (!caller) return;
    if (!(await ensureAdmin(caller.uid, res))) return;

    try {
      const body = asRecord(req.body);
      const result = validateConfigInput(body);
      if (!result.ok) {
        res
          .status(400)
          .json({ message: 'Invalid config', errors: result.errors });
        return;
      }
      const v = result.value;
      const nowDate = new Date();
      const nextRefreshAt = v.enabled
        ? computeNextRefreshAt(v.refresh, nowDate)
        : null;
      const ref = db.collection('courseFetchConfigs').doc();
      await ref.set({
        id: ref.id,
        ...v,
        lastStatus: 'idle',
        nextRefreshAt,
        createdAt: now(),
        updatedAt: now(),
        createdBy: caller.uid,
        updatedBy: caller.uid,
      });
      res.status(200).json({ id: ref.id });
    } catch (error) {
      console.error('createCourseFetchConfig failed:', error);
      fail(res, 'Failed to create config', 500);
    }
  }
);

export const updateCourseFetchConfig = functions.https.onRequest(
  async (req: Request, res: Response) => {
    setCors(req, res);
    if (!handleMethod(req, res)) return;
    const caller = await verifyAuth(req, res);
    if (!caller) return;
    if (!(await ensureAdmin(caller.uid, res))) return;

    try {
      const body = asRecord(req.body);
      const id = readString(body, 'id');
      if (!id) {
        fail(res, 'Missing id');
        return;
      }
      const ref = db.collection('courseFetchConfigs').doc(id);
      const existing = await ref.get();
      if (!existing.exists) {
        fail(res, 'Config not found', 404);
        return;
      }
      const result = validateConfigInput(body);
      if (!result.ok) {
        res
          .status(400)
          .json({ message: 'Invalid config', errors: result.errors });
        return;
      }
      const v = result.value;
      const nowDate = new Date();
      const nextRefreshAt = v.enabled
        ? computeNextRefreshAt(v.refresh, nowDate)
        : null;
      await ref.set(
        {
          ...v,
          nextRefreshAt,
          updatedAt: now(),
          updatedBy: caller.uid,
        },
        { merge: true }
      );
      res.status(200).json({ id });
    } catch (error) {
      console.error('updateCourseFetchConfig failed:', error);
      fail(res, 'Failed to update config', 500);
    }
  }
);

export const deleteCourseFetchConfig = functions.https.onRequest(
  async (req: Request, res: Response) => {
    setCors(req, res);
    if (!handleMethod(req, res)) return;
    const caller = await verifyAuth(req, res);
    if (!caller) return;
    if (!(await ensureAdmin(caller.uid, res))) return;

    try {
      const body = asRecord(req.body);
      const id = readString(body, 'id');
      if (!id) {
        fail(res, 'Missing id');
        return;
      }
      // Delete all run records first (in small pages), then the config. We
      // leave catalog docs in place — other configs may also source them.
      const runsCol = db
        .collection('courseFetchConfigs')
        .doc(id)
        .collection('runs');
      while (true) {
        const page = await runsCol.limit(200).get();
        if (page.empty) break;
        const batch = db.batch();
        page.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      await db.collection('courseFetchConfigs').doc(id).delete();
      res.status(200).json({ id, deleted: true });
    } catch (error) {
      console.error('deleteCourseFetchConfig failed:', error);
      fail(res, 'Failed to delete config', 500);
    }
  }
);

// --- Manual trigger ---

async function loadValidatedConfig(
  id: string
): Promise<{
  config: ValidatedConfig;
  doc: FirebaseFirestore.DocumentSnapshot;
} | null> {
  const snap = await db.collection('courseFetchConfigs').doc(id).get();
  if (!snap.exists) return null;
  const input = snap.data() ?? {};
  const result = validateConfigInput(input as Record<string, unknown>);
  if (!result.ok) return null;
  return { config: result.value, doc: snap };
}

export const triggerCourseFetch = functions.https.onRequest(
  async (req: Request, res: Response) => {
    setCors(req, res);
    if (!handleMethod(req, res)) return;
    const caller = await verifyAuth(req, res);
    if (!caller) return;
    if (!(await ensureAdmin(caller.uid, res))) return;

    try {
      const body = asRecord(req.body);
      const id = readString(body, 'id');
      if (!id) {
        fail(res, 'Missing id');
        return;
      }
      const loaded = await loadValidatedConfig(id);
      if (!loaded) {
        fail(res, 'Config not found or invalid', 404);
        return;
      }
      // Run synchronously. Cloud Functions v1 has a 540s timeout; a single
      // config shouldn't exceed that. If it does we'll split into shards.
      const outcome = await runAndPersist({
        db,
        configId: id,
        config: loaded.config,
        triggeredBy: 'manual',
        triggeredByUid: caller.uid,
      });
      res.status(200).json(outcome);
    } catch (error) {
      console.error('triggerCourseFetch failed:', error);
      fail(res, 'Failed to run fetch', 500);
    }
  }
);

// --- Run history ---

export const listCourseFetchRuns = functions.https.onRequest(
  async (req: Request, res: Response) => {
    setCors(req, res);
    if (!handleMethod(req, res)) return;
    const caller = await verifyAuth(req, res);
    if (!caller) return;
    if (!(await ensureAdmin(caller.uid, res))) return;

    try {
      const body = asRecord(req.body);
      const id = readString(body, 'id');
      const limitRaw = Number(body.limit);
      const limit = Number.isFinite(limitRaw)
        ? Math.max(1, Math.min(100, limitRaw))
        : 20;
      if (!id) {
        fail(res, 'Missing id');
        return;
      }
      const snap = await db
        .collection('courseFetchConfigs')
        .doc(id)
        .collection('runs')
        .orderBy('startedAt', 'desc')
        .limit(limit)
        .get();
      const runs = snap.docs.map((d) => ({ runId: d.id, ...d.data() }));
      res.status(200).json({ runs });
    } catch (error) {
      console.error('listCourseFetchRuns failed:', error);
      fail(res, 'Failed to list runs', 500);
    }
  }
);

// --- Scheduled refresh ---
//
// Runs every 30 minutes. Iterates enabled configs whose `nextRefreshAt` is
// due. Idempotent via a lease field — two concurrent invocations won't both
// run the same config because the second one's transaction sees the updated
// lease and skips.

export const scheduledCourseFetchRefresh = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async () => {
    const nowDate = new Date();
    const snap = await db
      .collection('courseFetchConfigs')
      .where('enabled', '==', true)
      .get();
    const candidates = snap.docs.filter((d) => {
      const data = d.data();
      const ref = data.nextRefreshAt;
      // nextRefreshAt is a Firestore Timestamp when set server-side.
      const dueAt =
        ref && typeof ref.toDate === 'function' ? ref.toDate() : ref ?? null;
      if (!dueAt) return true; // enabled but no schedule computed yet
      return dueAt instanceof Date && dueAt.getTime() <= nowDate.getTime();
    });

    for (const doc of candidates) {
      const id = doc.id;
      const ref = db.collection('courseFetchConfigs').doc(id);
      const token = `${nowDate.toISOString()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

      // Lease: skip if someone else claimed within the last 10 minutes.
      const leased = await db.runTransaction(async (tx) => {
        const latest = await tx.get(ref);
        if (!latest.exists) return false;
        const data = latest.data() as Record<string, unknown>;
        const leaseUntil = data.runLeaseUntil;
        const leaseDate =
          leaseUntil &&
          typeof (leaseUntil as { toDate?: unknown }).toDate === 'function'
            ? (leaseUntil as { toDate: () => Date }).toDate()
            : null;
        if (leaseDate && leaseDate.getTime() > nowDate.getTime()) return false;
        tx.set(
          ref,
          {
            runLeaseUntil: new Date(nowDate.getTime() + 10 * 60 * 1000),
            runLeaseToken: token,
          },
          { merge: true }
        );
        return true;
      });
      if (!leased) continue;

      const loaded = await loadValidatedConfig(id);
      if (!loaded) {
        await ref.set(
          {
            lastStatus: 'failed',
            lastError: 'config validation failed',
            runLeaseUntil: admin.firestore.FieldValue.delete(),
            runLeaseToken: admin.firestore.FieldValue.delete(),
          },
          { merge: true }
        );
        continue;
      }
      try {
        await runAndPersist({
          db,
          configId: id,
          config: loaded.config,
          triggeredBy: 'scheduled',
        });
      } catch (err) {
        console.error(`scheduled run ${id} failed:`, err);
      } finally {
        await ref.set(
          {
            runLeaseUntil: admin.firestore.FieldValue.delete(),
            runLeaseToken: admin.firestore.FieldValue.delete(),
          },
          { merge: true }
        );
      }
    }
    return null;
  });
