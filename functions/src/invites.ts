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
import { sendInviteNotificationEmail } from './nodemailer';

// Pending-memberships pattern (Unit 4 of multi-department support).
//
// An admin creates `pendingMemberships/{emailLower}` with the role they want
// the invitee to hold. When the invitee first signs in (via processSignUpForm
// for brand-new users, or via an explicit call from useCurrentUser for
// existing ones), `materializePendingMemberships` reads the doc, writes the
// role into `users/{uid}.roles[]`, and deletes the pending doc.
//
// Deliberately no signed tokens, no TTLs, no single-use enforcement, and no
// bound oobCodes. The invite doc is idempotent: re-creating it just refreshes
// `invitedAt`; deleting it is the revoke path; a second click after
// materialization is a no-op.

type PerDeptRole = 'admin' | 'faculty';

function parseRole(value: unknown): PerDeptRole | null {
  return value === 'admin' || value === 'faculty' ? value : null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const SIGN_IN_URL =
  process.env.INVITE_SIGN_IN_URL ?? 'https://courseconnect.eng.ufl.edu';

async function departmentActive(deptId: string): Promise<{
  exists: boolean;
  active: boolean;
  name: string | null;
}> {
  const snap = await db.collection('departments').doc(deptId).get();
  if (!snap.exists) return { exists: false, active: false, name: null };
  const data = snap.data() as Record<string, unknown>;
  return {
    exists: true,
    active: data.status !== 'archived',
    name: typeof data.name === 'string' ? (data.name as string) : null,
  };
}

async function callerAdminsDept(
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
  // Legacy transition fallback.
  if (data.role === 'admin' && typeof data.department === 'string') {
    return data.department.toLowerCase() === deptId;
  }
  return false;
}

// --- endpoints ---

export const createPendingMembership = functions.https.onRequest(
  async (req, res) => {
    setCors(req, res);
    if (!handleMethod(req, res)) return;

    const caller = await verifyAuth(req, res);
    if (!caller) return;

    try {
      const body = asRecord(req.body);
      const rawEmail = readString(body, 'email');
      const deptId = readString(body, 'deptId');
      const role = parseRole(body.role);
      if (!rawEmail || !deptId || !role) {
        fail(res, 'Missing email, deptId, or role');
        return;
      }
      const email = normalizeEmail(rawEmail);

      // Authorization: admin-role invites require super admin; faculty-role
      // invites require dept admin or super admin.
      if (role === 'admin') {
        const ok = await ensureSuperAdmin(caller.uid, res);
        if (!ok) return;
      } else {
        const allowed = await callerAdminsDept(caller.uid, deptId);
        if (!allowed) {
          res.status(403).json({ message: 'Forbidden' });
          return;
        }
      }

      const dept = await departmentActive(deptId);
      if (!dept.exists) {
        fail(res, 'Unknown department', 404);
        return;
      }
      if (!dept.active) {
        fail(res, 'Department is archived; cannot invite.', 409);
        return;
      }

      // Single-admin-per-user: if inviting someone to admin a dept and they
      // already hold admin elsewhere (pending or materialized), reject.
      if (role === 'admin') {
        let alreadyAdmin = false;

        const pending = await db
          .collection('pendingMemberships')
          .where('email', '==', email)
          .where('role', '==', 'admin')
          .limit(1)
          .get();
        if (!pending.empty && pending.docs[0].data().deptId !== deptId) {
          alreadyAdmin = true;
        }

        if (!alreadyAdmin) {
          try {
            const user = await auth.getUserByEmail(email);
            const userSnap = await db.collection('users').doc(user.uid).get();
            const existing = userSnap.data()?.roles;
            if (Array.isArray(existing)) {
              for (const r of existing) {
                if (
                  r &&
                  typeof r === 'object' &&
                  (r as Record<string, unknown>).role === 'admin' &&
                  (r as Record<string, unknown>).deptId !== deptId
                ) {
                  alreadyAdmin = true;
                  break;
                }
              }
            }
          } catch (err) {
            // User doesn't exist in Auth yet — no conflict possible.
          }
        }

        if (alreadyAdmin) {
          fail(
            res,
            `${email} already holds admin in a different department. Revoke first.`,
            409
          );
          return;
        }
      }

      // Look up inviter's display name for the email body.
      const inviterSnap = await db.collection('users').doc(caller.uid).get();
      const inviterData = inviterSnap.data() as
        | Record<string, unknown>
        | undefined;
      const inviterName =
        (typeof inviterData?.firstname === 'string'
          ? (inviterData.firstname as string)
          : '') +
        (typeof inviterData?.lastname === 'string'
          ? ` ${inviterData.lastname as string}`
          : '');
      const inviterLabel = inviterName.trim() || 'a Course Connect admin';

      const now = admin.firestore.FieldValue.serverTimestamp();
      await db
        .collection('pendingMemberships')
        .doc(email)
        .set(
          {
            email,
            deptId,
            role,
            deptName: dept.name ?? deptId.toUpperCase(),
            invitedBy: caller.uid,
            invitedByName: inviterLabel,
            invitedAt: now,
          },
          { merge: true }
        );

      // Best-effort email notification. Failure does not roll back the
      // pending doc — the inviter can resend via the admin UI.
      try {
        await sendInviteNotificationEmail(
          { email },
          dept.name ?? deptId.toUpperCase(),
          role === 'admin' ? 'admin' : 'faculty',
          inviterLabel,
          SIGN_IN_URL
        );
      } catch (err) {
        console.error('Invite email dispatch failed (non-fatal):', err);
        res.status(200).json({
          email,
          deptId,
          role,
          notificationEmailFailed: true,
        });
        return;
      }

      res.status(200).json({ email, deptId, role });
    } catch (error) {
      console.error('createPendingMembership failed:', error);
      fail(res, 'Error creating invite', 500);
    }
  }
);

export const revokePendingMembership = functions.https.onRequest(
  async (req, res) => {
    setCors(req, res);
    if (!handleMethod(req, res)) return;

    const caller = await verifyAuth(req, res);
    if (!caller) return;

    try {
      const body = asRecord(req.body);
      const rawEmail = readString(body, 'email');
      if (!rawEmail) {
        fail(res, 'Missing email');
        return;
      }
      const email = normalizeEmail(rawEmail);

      const ref = db.collection('pendingMemberships').doc(email);
      const snap = await ref.get();
      if (!snap.exists) {
        res.status(200).json({ email, alreadyGone: true });
        return;
      }

      const data = snap.data() as Record<string, unknown>;
      const deptId = typeof data.deptId === 'string' ? data.deptId : '';
      const role = parseRole(data.role);

      if (role === 'admin') {
        const ok = await ensureSuperAdmin(caller.uid, res);
        if (!ok) return;
      } else {
        const allowed = await callerAdminsDept(caller.uid, deptId);
        if (!allowed) {
          res.status(403).json({ message: 'Forbidden' });
          return;
        }
      }

      await ref.delete();
      res.status(200).json({ email });
    } catch (error) {
      console.error('revokePendingMembership failed:', error);
      fail(res, 'Error revoking invite', 500);
    }
  }
);

// Materialize any pending memberships for a user's verified email into their
// users/{uid}.roles[]. Idempotent. Callable by the user themselves (most
// common path) or by an authenticated client on mount as a safety net.
export const materializePendingMemberships = functions.https.onRequest(
  async (req, res) => {
    setCors(req, res);
    if (!handleMethod(req, res)) return;

    const caller = await verifyAuth(req, res);
    if (!caller) return;

    try {
      const callerEmail =
        typeof caller.email === 'string' ? normalizeEmail(caller.email) : null;
      if (!callerEmail) {
        res.status(200).json({ materialized: 0, reason: 'no email on token' });
        return;
      }

      const pendingRef = db.collection('pendingMemberships').doc(callerEmail);
      const pendingSnap = await pendingRef.get();
      if (!pendingSnap.exists) {
        res.status(200).json({ materialized: 0 });
        return;
      }

      const data = pendingSnap.data() as Record<string, unknown>;
      const deptId = typeof data.deptId === 'string' ? data.deptId : '';
      const role = parseRole(data.role);
      if (!deptId || !role) {
        // Corrupted pending doc — delete so it doesn't sit forever.
        await pendingRef.delete();
        res.status(200).json({ materialized: 0, reason: 'malformed pending' });
        return;
      }

      const dept = await departmentActive(deptId);
      if (!dept.exists || !dept.active) {
        // Dept went away or was archived — surface this to the caller but
        // keep the pending doc so an admin can see the orphan.
        res.status(200).json({
          materialized: 0,
          reason: dept.exists ? 'department archived' : 'department missing',
        });
        return;
      }

      const userRef = db.collection('users').doc(caller.uid);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const existing = snap.exists
          ? (snap.data()?.roles as unknown[]) ?? []
          : [];
        const already = Array.isArray(existing)
          ? existing.some(
              (r) =>
                r &&
                typeof r === 'object' &&
                (r as Record<string, unknown>).deptId === deptId &&
                (r as Record<string, unknown>).role === role
            )
          : false;

        const next = already
          ? existing
          : [...(Array.isArray(existing) ? existing : []), { deptId, role }];

        const adminIds = new Set<string>();
        const facultyIds = new Set<string>();
        for (const entry of next) {
          if (entry && typeof entry === 'object') {
            const r = entry as Record<string, unknown>;
            if (r.role === 'admin' && typeof r.deptId === 'string') {
              adminIds.add(r.deptId as string);
            }
            if (r.role === 'faculty' && typeof r.deptId === 'string') {
              facultyIds.add(r.deptId as string);
            }
          }
        }

        tx.set(
          userRef,
          {
            roles: next,
            adminOfDepartmentIds: Array.from(adminIds).sort(),
            facultyOfDepartmentIds: Array.from(facultyIds).sort(),
            departmentIds: Array.from(
              new Set([...adminIds, ...facultyIds])
            ).sort(),
          },
          { merge: true }
        );

        tx.delete(pendingRef);
      });

      res.status(200).json({ materialized: 1, deptId, role });
    } catch (error) {
      console.error('materializePendingMemberships failed:', error);
      fail(res, 'Error materializing pending memberships', 500);
    }
  }
);
