import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {
  asRecord,
  auth,
  db,
  ensureSuperAdmin,
  fail,
  handleMethod,
  readString,
  setCors,
  verifyAuth,
} from './shared';

// Per-department roles stored on the user doc. Plan: the `roles` array is the
// authoritative shape; `adminOfDepartmentIds` / `facultyOfDepartmentIds` /
// `departmentIds` are denormalized convenience fields maintained here so
// Firestore rules can answer "does this user admin department X?" with a
// cheap field-check instead of iterating the array.
type PerDeptRole = 'admin' | 'faculty';

interface RoleEntry {
  deptId: string;
  role: PerDeptRole;
}

function parseRole(value: unknown): PerDeptRole | null {
  return value === 'admin' || value === 'faculty' ? value : null;
}

function sanitizeRoleEntries(value: unknown): RoleEntry[] {
  if (!Array.isArray(value)) return [];
  const out: RoleEntry[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const rec = entry as Record<string, unknown>;
    const deptId = typeof rec.deptId === 'string' ? rec.deptId : null;
    const role = parseRole(rec.role);
    if (deptId && role) out.push({ deptId, role });
  }
  return out;
}

function withEntry(
  roles: RoleEntry[],
  deptId: string,
  role: PerDeptRole
): RoleEntry[] {
  // Single-admin-per-user is enforced at the caller level; here we just replace
  // an existing (deptId, role) entry so re-invites are idempotent.
  const remaining = roles.filter(
    (r) => !(r.deptId === deptId && r.role === role)
  );
  remaining.push({ deptId, role });
  return remaining;
}

function withoutEntry(
  roles: RoleEntry[],
  deptId: string,
  role: PerDeptRole
): RoleEntry[] {
  return roles.filter((r) => !(r.deptId === deptId && r.role === role));
}

function deriveDenormalized(roles: RoleEntry[]) {
  const adminIds = new Set<string>();
  const facultyIds = new Set<string>();
  for (const r of roles) {
    if (r.role === 'admin') adminIds.add(r.deptId);
    if (r.role === 'faculty') facultyIds.add(r.deptId);
  }
  const union = new Set<string>([...adminIds, ...facultyIds]);
  return {
    adminOfDepartmentIds: Array.from(adminIds).sort(),
    facultyOfDepartmentIds: Array.from(facultyIds).sort(),
    departmentIds: Array.from(union).sort(),
  };
}

// Authorization for faculty-role mutations: super admin OR an active admin of
// the target dept. Reads the caller's doc once. During the transition window
// also honors the legacy `users/{uid}.role === 'admin'` + `department ===
// deptId` signal so existing admins can invite faculty before the backfill
// lands.
async function canManageFacultyIn(
  callerUid: string,
  deptId: string
): Promise<boolean> {
  const snap = await db.collection('users').doc(callerUid).get();
  const data = snap.data() as Record<string, unknown> | undefined;
  if (!data) return false;
  if (data.superAdmin === true) return true;

  const adminIds = Array.isArray(data.adminOfDepartmentIds)
    ? (data.adminOfDepartmentIds as unknown[]).filter(
        (v): v is string => typeof v === 'string'
      )
    : [];
  if (adminIds.includes(deptId)) return true;

  // Legacy fallback (Unit 1..7 window).
  if (data.role === 'admin' && typeof data.department === 'string') {
    return data.department.toLowerCase() === deptId;
  }
  return false;
}

async function departmentExists(deptId: string): Promise<boolean> {
  const snap = await db.collection('departments').doc(deptId).get();
  return snap.exists;
}

async function applyRoleWrite(
  uid: string,
  mutate: (existing: RoleEntry[]) => RoleEntry[]
): Promise<RoleEntry[]> {
  const userRef = db.collection('users').doc(uid);
  let next: RoleEntry[] = [];

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) {
      // Initialize a minimal user doc so the role can land even if the user
      // hasn't signed in yet (e.g., materialization from pendingMemberships).
      tx.set(
        userRef,
        {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    const existing = sanitizeRoleEntries(snap.data()?.roles);
    next = mutate(existing);

    const denorm = deriveDenormalized(next);
    tx.set(
      userRef,
      {
        roles: next,
        ...denorm,
      },
      { merge: true }
    );
  });

  return next;
}

// --- endpoints ---

// setRole — grants (uid, deptId, role). Super admin may grant any role;
// dept admin may grant only `faculty` in their own department.
export const setRole = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (!handleMethod(req, res)) return;

  const caller = await verifyAuth(req, res);
  if (!caller) return;

  try {
    const body = asRecord(req.body);
    const uid = readString(body, 'uid');
    const deptId = readString(body, 'deptId');
    const role = parseRole(body.role);

    if (!uid || !deptId || !role) {
      fail(res, 'Missing uid, deptId, or role');
      return;
    }

    if (!(await departmentExists(deptId))) {
      fail(res, 'Unknown department', 404);
      return;
    }

    // Authorization: admin role requires super admin; faculty can be granted
    // by super admin or by an admin of the same department.
    if (role === 'admin') {
      const ok = await ensureSuperAdmin(caller.uid, res);
      if (!ok) return;
    } else {
      const allowed = await canManageFacultyIn(caller.uid, deptId);
      if (!allowed) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }

    // Enforce single-admin-per-user this pass.
    if (role === 'admin') {
      const target = await db.collection('users').doc(uid).get();
      const existing = sanitizeRoleEntries(target.data()?.roles);
      const currentAdmin = existing.find((r) => r.role === 'admin');
      if (currentAdmin && currentAdmin.deptId !== deptId) {
        fail(
          res,
          `User already holds admin role in ${currentAdmin.deptId}. Revoke first.`,
          409
        );
        return;
      }
    }

    const next = await applyRoleWrite(uid, (existing) =>
      withEntry(existing, deptId, role)
    );
    res.status(200).json({ uid, roles: next });
  } catch (error) {
    console.error('setRole failed:', error);
    fail(res, 'Error setting role', 500);
  }
});

export const revokeRole = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (!handleMethod(req, res)) return;

  const caller = await verifyAuth(req, res);
  if (!caller) return;

  try {
    const body = asRecord(req.body);
    const uid = readString(body, 'uid');
    const deptId = readString(body, 'deptId');
    const role = parseRole(body.role);

    if (!uid || !deptId || !role) {
      fail(res, 'Missing uid, deptId, or role');
      return;
    }

    if (role === 'admin') {
      const ok = await ensureSuperAdmin(caller.uid, res);
      if (!ok) return;
    } else {
      const allowed = await canManageFacultyIn(caller.uid, deptId);
      if (!allowed) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }

    const next = await applyRoleWrite(uid, (existing) =>
      withoutEntry(existing, deptId, role)
    );
    res.status(200).json({ uid, roles: next });
  } catch (error) {
    console.error('revokeRole failed:', error);
    fail(res, 'Error revoking role', 500);
  }
});

// promoteSuperAdmin — grant super admin to a user. Only a current super admin
// may call this. The first super admin is seeded via a one-time admin SDK
// script (see src/scripts/bootstrapSuperAdmin.ts); no web-callable bootstrap.
export const promoteSuperAdmin = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (!handleMethod(req, res)) return;

  const caller = await verifyAuth(req, res);
  if (!caller) return;
  const ok = await ensureSuperAdmin(caller.uid, res);
  if (!ok) return;

  try {
    const body = asRecord(req.body);
    const uid = readString(body, 'uid');
    if (!uid) {
      fail(res, 'Missing uid');
      return;
    }

    // Confirm the target user exists in Auth before stamping the flag.
    try {
      await auth.getUser(uid);
    } catch (err) {
      fail(res, 'Target user does not exist', 404);
      return;
    }

    // Also stamp role='admin' when the user lacks a staff role so the
    // existing admin pages and rules (which gate on role === 'admin')
    // accept them. Same behavior as bootstrapSuperAdmin.
    const existingSnap = await db.collection('users').doc(uid).get();
    const existingRole = existingSnap.data()?.role;
    const needsAdminRole =
      typeof existingRole !== 'string' ||
      existingRole === '' ||
      existingRole === 'unapproved' ||
      existingRole.startsWith('student');

    const payload: Record<string, unknown> = {
      superAdmin: true,
      superAdminAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (needsAdminRole) {
      payload.role = 'admin';
    }

    await db.collection('users').doc(uid).set(payload, { merge: true });

    res.status(200).json({
      uid,
      superAdmin: true,
      roleStampedAdmin: needsAdminRole,
    });
  } catch (error) {
    console.error('promoteSuperAdmin failed:', error);
    fail(res, 'Error promoting super admin', 500);
  }
});

// demoteSuperAdmin — inverse of promoteSuperAdmin. Only callable by another
// super admin; callers cannot demote themselves (invariant: at least one
// super admin must exist at all times).
export const demoteSuperAdmin = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (!handleMethod(req, res)) return;

  const caller = await verifyAuth(req, res);
  if (!caller) return;
  const ok = await ensureSuperAdmin(caller.uid, res);
  if (!ok) return;

  try {
    const body = asRecord(req.body);
    const uid = readString(body, 'uid');
    if (!uid) {
      fail(res, 'Missing uid');
      return;
    }

    if (uid === caller.uid) {
      fail(
        res,
        'A super admin cannot demote themselves. Ask another super admin.',
        400
      );
      return;
    }

    // Refuse to demote the last super admin.
    const remaining = await db
      .collection('users')
      .where('superAdmin', '==', true)
      .limit(2)
      .get();
    if (remaining.size < 2) {
      fail(res, 'Cannot demote the last super admin.', 409);
      return;
    }

    await db.collection('users').doc(uid).set(
      {
        superAdmin: false,
        superAdminDemotedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.status(200).json({ uid, superAdmin: false });
  } catch (error) {
    console.error('demoteSuperAdmin failed:', error);
    fail(res, 'Error demoting super admin', 500);
  }
});
