import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {
  asRecord,
  db,
  ensureSuperAdmin,
  fail,
  handleMethod,
  readString,
  setCors,
  verifyAuth,
} from './shared';

// --- validation ---

const CODE_PATTERN = /^[A-Z]{2,6}$/;
const NAME_MIN = 1;
const NAME_MAX = 120;

type Department = {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'archived';
  createdAt: admin.firestore.FieldValue;
  archivedAt?: admin.firestore.FieldValue;
};

function codeToId(code: string): string {
  return code.toLowerCase();
}

function validateCode(
  code: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof code !== 'string' || !CODE_PATTERN.test(code)) {
    return {
      ok: false,
      error: 'Code must be uppercase A–Z only, 2–6 characters.',
    };
  }
  return { ok: true, value: code };
}

function validateName(
  name: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof name !== 'string') {
    return { ok: false, error: 'Name is required.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
    return {
      ok: false,
      error: `Name must be between ${NAME_MIN} and ${NAME_MAX} characters.`,
    };
  }
  return { ok: true, value: trimmed };
}

// Check that no department record exists with this code (active or archived).
// Codes are never reused to keep historical references unambiguous.
async function ensureCodeUnused(code: string): Promise<boolean> {
  const id = codeToId(code);
  const direct = await db.collection('departments').doc(id).get();
  if (direct.exists) return false;

  // Also scan for any older doc that might have used the same code under a
  // different id. Cheap at this scale (tiny departments collection).
  const dup = await db
    .collection('departments')
    .where('code', '==', code)
    .limit(1)
    .get();
  return dup.empty;
}

// --- endpoints ---

export const createDepartment = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (!handleMethod(req, res)) return;

  const caller = await verifyAuth(req, res);
  if (!caller) return;
  const ok = await ensureSuperAdmin(caller.uid, res);
  if (!ok) return;

  try {
    const body = asRecord(req.body);
    const codeCheck = validateCode(readString(body, 'code'));
    if (!codeCheck.ok) {
      fail(res, codeCheck.error);
      return;
    }
    const nameCheck = validateName(readString(body, 'name'));
    if (!nameCheck.ok) {
      fail(res, nameCheck.error);
      return;
    }

    const code = codeCheck.value;
    const name = nameCheck.value;
    const id = codeToId(code);

    const unused = await ensureCodeUnused(code);
    if (!unused) {
      fail(res, `Department code ${code} is already in use.`, 409);
      return;
    }

    const doc: Department = {
      id,
      code,
      name,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('departments').doc(id).set(doc);

    res.status(200).json({ id, code, name, status: 'active' });
  } catch (error) {
    console.error('createDepartment failed:', error);
    fail(res, 'Error creating department', 500);
  }
});

export const updateDepartment = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (!handleMethod(req, res)) return;

  const caller = await verifyAuth(req, res);
  if (!caller) return;
  const ok = await ensureSuperAdmin(caller.uid, res);
  if (!ok) return;

  try {
    const body = asRecord(req.body);
    const id = readString(body, 'id');
    if (!id) {
      fail(res, 'Missing department id');
      return;
    }

    const ref = db.collection('departments').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      fail(res, 'Department not found', 404);
      return;
    }

    const updates: Record<string, unknown> = {};
    const rawName = readString(body, 'name');
    if (rawName !== undefined) {
      const nameCheck = validateName(rawName);
      if (!nameCheck.ok) {
        fail(res, nameCheck.error);
        return;
      }
      updates.name = nameCheck.value;
    }

    if (Object.keys(updates).length === 0) {
      fail(res, 'No editable fields provided');
      return;
    }

    await ref.update(updates);
    res.status(200).json({ id, ...updates });
  } catch (error) {
    console.error('updateDepartment failed:', error);
    fail(res, 'Error updating department', 500);
  }
});

export const archiveDepartment = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (!handleMethod(req, res)) return;

  const caller = await verifyAuth(req, res);
  if (!caller) return;
  const ok = await ensureSuperAdmin(caller.uid, res);
  if (!ok) return;

  try {
    const body = asRecord(req.body);
    const id = readString(body, 'id');
    if (!id) {
      fail(res, 'Missing department id');
      return;
    }

    const ref = db.collection('departments').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      fail(res, 'Department not found', 404);
      return;
    }
    if (snap.data()?.status === 'archived') {
      res.status(200).json({ id, status: 'archived', alreadyArchived: true });
      return;
    }

    await ref.update({
      status: 'archived',
      archivedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ id, status: 'archived' });
  } catch (error) {
    console.error('archiveDepartment failed:', error);
    fail(res, 'Error archiving department', 500);
  }
});

export const unarchiveDepartment = functions.https.onRequest(
  async (req, res) => {
    setCors(req, res);
    if (!handleMethod(req, res)) return;

    const caller = await verifyAuth(req, res);
    if (!caller) return;
    const ok = await ensureSuperAdmin(caller.uid, res);
    if (!ok) return;

    try {
      const body = asRecord(req.body);
      const id = readString(body, 'id');
      if (!id) {
        fail(res, 'Missing department id');
        return;
      }

      const ref = db.collection('departments').doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        fail(res, 'Department not found', 404);
        return;
      }
      if (snap.data()?.status !== 'archived') {
        res.status(200).json({ id, status: 'active', alreadyActive: true });
        return;
      }

      await ref.update({
        status: 'active',
        archivedAt: admin.firestore.FieldValue.delete(),
      });
      res.status(200).json({ id, status: 'active' });
    } catch (error) {
      console.error('unarchiveDepartment failed:', error);
      fail(res, 'Error unarchiving department', 500);
    }
  }
);
