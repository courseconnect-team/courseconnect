import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import type { Request, Response } from 'express';
import {
  sendForgotPasswordEmail,
  sendApplicationConfirmationEmail,
  sendApplicationStatusApprovedEmail,
  sendApplicationStatusDeniedEmail,
  sendFacultyNotificationEmail,
  sendUnapprovedUserNotificationEmail,
  sendFacultyAssignedNotificationEmail,
  sendRenewTAEmail,
  sendApplicantToFaculty,
  sendStatusUpdateToApplicant,
} from './nodemailer';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();
db.settings({ ignoreUndefinedProperties: true });

const ALLOWED_ORIGINS = new Set(
  [
    'https://courseconnect.eng.ufl.edu',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  ].filter(Boolean)
);

const STAFF_ROLES = new Set(['admin', 'faculty']);

type EmailType =
  | 'sendApplicantToFaculty'
  | 'sendStatusUpdateToApplicant'
  | 'forgotPassword'
  | 'applicationConfirmation'
  | 'applicationStatusApproved'
  | 'applicationStatusDenied'
  | 'facultyNotification'
  | 'facultyAssignment'
  | 'unapprovedUser'
  | 'renewTA';

type ApplicationType = 'course_assistant' | 'supervised_teaching';

function setCors(req: Request, res: Response): void {
  const origin = req.get('origin');
  res.set('Vary', 'Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function handleMethod(req: Request, res: Response): boolean {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return false;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return false;
  }
  return true;
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring('Bearer '.length).trim();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function readString(
  source: Record<string, unknown>,
  key: string
): string | undefined {
  const value = source[key];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function readEmailType(value: unknown): EmailType | null {
  if (typeof value !== 'string') return null;
  const allowed: EmailType[] = [
    'sendApplicantToFaculty',
    'sendStatusUpdateToApplicant',
    'forgotPassword',
    'applicationConfirmation',
    'applicationStatusApproved',
    'applicationStatusDenied',
    'facultyNotification',
    'facultyAssignment',
    'unapprovedUser',
    'renewTA',
  ];
  return allowed.includes(value as EmailType) ? (value as EmailType) : null;
}

function readApplicationType(value: unknown): ApplicationType | null {
  if (value === 'course_assistant' || value === 'supervised_teaching') {
    return value;
  }
  return null;
}

async function verifyAuth(
  req: Request,
  res: Response
): Promise<admin.auth.DecodedIdToken | null> {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ message: 'Missing bearer token' });
    return null;
  }

  try {
    return await auth.verifyIdToken(token);
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Invalid auth token' });
    return null;
  }
}

async function getRole(uid: string): Promise<string> {
  const snap = await db.collection('users').doc(uid).get();
  const data = snap.data() as Record<string, unknown> | undefined;
  return typeof data?.role === 'string' ? data.role : '';
}

async function ensureStaffRole(
  uid: string,
  res: Response
): Promise<boolean> {
  const role = await getRole(uid);
  if (!STAFF_ROLES.has(role)) {
    res.status(403).json({ message: 'Forbidden' });
    return false;
  }
  return true;
}

function fail(res: Response, message: string, code = 400): void {
  res.status(code).json({ message });
}

export const sendEmail = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (!handleMethod(req, res)) return;

  try {
    const body = asRecord(req.body);
    const type = readEmailType(body.type);
    const data = asRecord(body.data);

    if (!type) {
      fail(res, 'Invalid email type');
      return;
    }

    const isPublicType = type === 'forgotPassword' || type === 'unapprovedUser';
    let caller: admin.auth.DecodedIdToken | null = null;

    if (!isPublicType) {
      caller = await verifyAuth(req, res);
      if (!caller) return;
    }

    const staffOnlyTypes = new Set<EmailType>([
      'sendApplicantToFaculty',
      'sendStatusUpdateToApplicant',
      'applicationStatusApproved',
      'applicationStatusDenied',
      'facultyNotification',
      'facultyAssignment',
      'renewTA',
    ]);

    if (caller && staffOnlyTypes.has(type)) {
      const ok = await ensureStaffRole(caller.uid, res);
      if (!ok) return;
    }

    switch (type) {
      case 'sendApplicantToFaculty': {
        const user = asRecord(data.user);
        const userEmail = readString(user, 'email');
        const projectTitle = readString(data, 'project_title');
        if (!userEmail || !projectTitle) {
          fail(res, 'Missing required fields for sendApplicantToFaculty');
          return;
        }
        await sendApplicantToFaculty(
          { email: userEmail, name: readString(user, 'name') },
          projectTitle
        );
        break;
      }
      case 'sendStatusUpdateToApplicant': {
        const user = asRecord(data.user);
        const userEmail = readString(user, 'email');
        const projectTitle = readString(data, 'project_title');
        const status = readString(data, 'status');
        if (!userEmail || !projectTitle || !status) {
          fail(res, 'Missing required fields for sendStatusUpdateToApplicant');
          return;
        }
        await sendStatusUpdateToApplicant(
          { email: userEmail, name: readString(user, 'name') },
          projectTitle,
          status
        );
        break;
      }
      case 'forgotPassword': {
        const user = asRecord(data.user);
        const userEmail = readString(user, 'email');
        const resetLink = readString(data, 'resetLink');
        if (!userEmail || !resetLink) {
          fail(res, 'Missing required fields for forgotPassword');
          return;
        }
        await sendForgotPasswordEmail(
          { email: userEmail, name: readString(user, 'name') },
          resetLink
        );
        break;
      }
      case 'applicationConfirmation': {
        const user = asRecord(data.user);
        const userEmail = readString(user, 'email');
        const position = readString(data, 'position');
        const classCode = readString(data, 'classCode');
        if (!userEmail || !position || !classCode) {
          fail(res, 'Missing required fields for applicationConfirmation');
          return;
        }
        await sendApplicationConfirmationEmail(
          { email: userEmail, name: readString(user, 'name') },
          position,
          classCode
        );
        break;
      }
      case 'applicationStatusApproved': {
        const user = asRecord(data.user);
        const userEmail = readString(user, 'email');
        const position = readString(data, 'position');
        const classCode = readString(data, 'classCode');
        if (!userEmail || !position || !classCode) {
          fail(res, 'Missing required fields for applicationStatusApproved');
          return;
        }
        await sendApplicationStatusApprovedEmail(
          { email: userEmail, name: readString(user, 'name') },
          position,
          classCode
        );
        break;
      }
      case 'applicationStatusDenied': {
        const user = asRecord(data.user);
        const userEmail = readString(user, 'email');
        const position = readString(data, 'position');
        const classCode = readString(data, 'classCode');
        if (!userEmail || !position || !classCode) {
          fail(res, 'Missing required fields for applicationStatusDenied');
          return;
        }
        await sendApplicationStatusDeniedEmail(
          { email: userEmail, name: readString(user, 'name') },
          position,
          classCode
        );
        break;
      }
      case 'facultyNotification': {
        const user = asRecord(data.user);
        const userEmail = readString(user, 'email');
        const position = readString(data, 'position');
        const classCode = readString(data, 'classCode');
        if (!userEmail || !position || !classCode) {
          fail(res, 'Missing required fields for facultyNotification');
          return;
        }
        await sendFacultyNotificationEmail(
          { email: userEmail, name: readString(user, 'name') },
          position,
          classCode
        );
        break;
      }
      case 'facultyAssignment': {
        const userEmail = readString(data, 'userEmail');
        const position = readString(data, 'position');
        const classCode = readString(data, 'classCode');
        const semester = readString(data, 'semester');
        if (!userEmail || !position || !classCode || !semester) {
          fail(res, 'Missing required fields for facultyAssignment');
          return;
        }
        await sendFacultyAssignedNotificationEmail(
          userEmail,
          position,
          classCode,
          semester
        );
        break;
      }
      case 'unapprovedUser': {
        const user = asRecord(data.user);
        const userEmail = readString(user, 'email');
        if (!userEmail) {
          fail(res, 'Missing required fields for unapprovedUser');
          return;
        }
        await sendUnapprovedUserNotificationEmail({
          email: userEmail,
          name: readString(user, 'name'),
        });
        break;
      }
      case 'renewTA': {
        const userEmail = readString(data, 'userEmail');
        const message = readString(data, 'message');
        const subject = readString(data, 'subject');
        if (!userEmail || !message || !subject) {
          fail(res, 'Missing required fields for renewTA');
          return;
        }
        await sendRenewTAEmail(userEmail, message, subject);
        break;
      }
      default:
        fail(res, 'Invalid email type');
        return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('sendEmail failed:', error);
    fail(res, 'Failed to send email', 500);
  }
});

export const processSignUpForm = functions.https.onRequest(
  async (request, response) => {
    setCors(request, response);
    if (!handleMethod(request, response)) return;

    try {
      const body = asRecord(request.body);
      const firstname = readString(body, 'firstname');
      const lastname = readString(body, 'lastname');
      const email = readString(body, 'email');
      const department = readString(body, 'department');
      const role = readString(body, 'role');
      const ufid = readString(body, 'ufid');
      const uid = readString(body, 'uid');

      if (
        !firstname ||
        !lastname ||
        !email ||
        !department ||
        !role ||
        !ufid ||
        !uid
      ) {
        fail(response, 'Missing required signup fields');
        return;
      }

      await auth.getUser(uid);

      const userRef = db.collection('users').doc(uid);
      await db.runTransaction(async (tx) => {
        const existing = await tx.get(userRef);
        const payload: Record<string, unknown> = {
          firstname,
          lastname,
          email,
          department,
          role,
          ufid,
          uid,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (!existing.exists) {
          payload.created_at = admin.firestore.FieldValue.serverTimestamp();
        }

        tx.set(userRef, payload, { merge: true });
      });

      response.status(200).send('User created successfully');
    } catch (error) {
      console.error('processSignUpForm failed:', error);
      fail(response, 'Error creating user', 500);
    }
  }
);

export const processApplicationForm = functions.https.onRequest(
  async (request, response) => {
    setCors(request, response);
    if (!handleMethod(request, response)) return;

    const caller = await verifyAuth(request, response);
    if (!caller) return;

    try {
      const body = asRecord(request.body);
      const type = readApplicationType(body.application_type);
      const uidFromBody = readString(body, 'uid');
      const uid = uidFromBody || caller.uid;

      if (!type) {
        fail(response, 'Invalid application type');
        return;
      }

      if (uid !== caller.uid) {
        const ok = await ensureStaffRole(caller.uid, response);
        if (!ok) return;
      }

      const applicationRef = db
        .collection('applications')
        .doc(type)
        .collection('uid')
        .doc(uid);

      await db.runTransaction(async (tx) => {
        const existing = await tx.get(applicationRef);
        const payload: Record<string, unknown> = {
          ...body,
          application_type: type,
          uid,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        delete payload.created_at;
        delete payload.updated_at;

        if (!existing.exists) {
          payload.created_at = admin.firestore.FieldValue.serverTimestamp();
        }

        tx.set(applicationRef, payload, { merge: true });
      });

      response.status(200).send('Application created successfully');
    } catch (error) {
      console.error('processApplicationForm failed:', error);
      fail(response, 'Error creating application', 500);
    }
  }
);

export const processCreateCourseForm = functions.https.onRequest(
  async (request, response) => {
    setCors(request, response);
    if (!handleMethod(request, response)) return;

    const caller = await verifyAuth(request, response);
    if (!caller) return;

    const staffOk = await ensureStaffRole(caller.uid, response);
    if (!staffOk) return;

    try {
      const body = asRecord(request.body);
      const id = readString(body, 'id');
      const code = readString(body, 'code');
      const title = readString(body, 'title');

      if (!id || !code || !title) {
        fail(response, 'Missing required course fields');
        return;
      }

      const courseObject = {
        code,
        title,
        id,
        professor_names: body.professor_names ?? [],
        professor_emails: body.professor_emails ?? [],
        helper_names: body.helper_names ?? [],
        helper_emails: body.helper_emails ?? [],
        credits: body.credits ?? '',
        enrollment_cap: body.enrollment_cap ?? '',
        num_enrolled: body.num_enrolled ?? '',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('courses').doc(id).set(courseObject, { merge: true });
      response.status(200).send('Course created successfully');
    } catch (error) {
      console.error('processCreateCourseForm failed:', error);
      fail(response, 'Error creating course', 500);
    }
  }
);

export const deleteUserFromID = functions.https.onRequest(
  async (request, response) => {
    setCors(request, response);
    if (!handleMethod(request, response)) return;

    const caller = await verifyAuth(request, response);
    if (!caller) return;

    try {
      const body = asRecord(request.body);
      const targetUid = readString(body, 'auth_id');

      if (!targetUid) {
        fail(response, 'Missing auth_id');
        return;
      }

      if (targetUid !== caller.uid) {
        const roleOk = await ensureStaffRole(caller.uid, response);
        if (!roleOk) return;
      }

      const deletes: Array<Promise<unknown>> = [
        db.collection('users').doc(targetUid).delete(),
        db.collection('assignments').doc(targetUid).delete(),
        db.collection('applications').doc(targetUid).delete(), // legacy doc path
        db
          .collection('applications')
          .doc('course_assistant')
          .collection('uid')
          .doc(targetUid)
          .delete(),
        db
          .collection('applications')
          .doc('supervised_teaching')
          .collection('uid')
          .doc(targetUid)
          .delete(),
      ];

      const deleteResults = await Promise.allSettled(deletes);
      const failedDeletes = deleteResults.filter((r) => r.status === 'rejected');
      if (failedDeletes.length > 0) {
        console.error('Failed document deletes:', failedDeletes);
        fail(response, 'Failed to delete all user documents', 500);
        return;
      }

      try {
        await auth.deleteUser(targetUid);
      } catch (error) {
        const err = error as { code?: string };
        if (err.code !== 'auth/user-not-found') {
          throw error;
        }
      }

      response.status(200).send('User deleted successfully');
    } catch (error) {
      console.error('deleteUserFromID failed:', error);
      fail(response, 'Error deleting user', 500);
    }
  }
);
