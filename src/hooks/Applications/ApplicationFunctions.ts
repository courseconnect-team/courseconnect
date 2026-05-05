// api/applications.ts
import { getFirestore } from 'firebase/firestore';
import { ApplicationRepository } from '@/firebase/applications/applicationRepository';
import { callFunction } from '@/firebase/functions/callFunction';

type ApproveParams = {
  documentId: string;
  classCode: string;
  semester?: string;
  name: string;
  uf_email: string;
  position: string;
};
type DenyParams = ApproveParams;

const db = getFirestore();
const repo = new ApplicationRepository(db);

// Atomically set courses.<semester>.<classCode> = status on user's canonical
// course_assistant application (falling back to legacy flat keys if that's
// what the existing doc uses).
async function setCourseStatusAtomic(
  documentId: string,
  classCode: string,
  status: 'approved' | 'denied',
  semester?: string
) {
  // documentId is userId in the applications/{type}/uid/{uid} schema
  await repo.updateCourseStatusLatest(documentId, classCode, status, semester);
}

/** Approve: sets the flag atomically then sends a best-effort notification */
export async function approveApplication({
  documentId,
  classCode,
  semester,
  name,
  uf_email,
  position,
}: ApproveParams) {
  await setCourseStatusAtomic(documentId, classCode, 'approved', semester);

  try {
    await callFunction('sendEmail', {
      type: 'applicationStatusApproved',
      data: {
        user: { name, email: uf_email },
        position,
        classCode,
      },
    });
  } catch (err) {
    console.error('Failed to send approval email:', err);
  }

  return { ok: true as const };
}

/** Deny: set flag first, then attempt to send email */
export async function denyApplication({
  documentId,
  classCode,
  name,
  uf_email,
  position,
  semester,
}: DenyParams) {
  await setCourseStatusAtomic(documentId, classCode, 'denied', semester);

  // best-effort email (do not block the user even if email fails)
  try {
    await callFunction('sendEmail', {
      type: 'applicationStatusDenied',
      data: {
        user: { name, email: uf_email },
        position,
        classCode,
      },
    });
  } catch (err) {
    // log and carry on
    console.error('Failed to send deny email:', err);
  }

  return { ok: true as const };
}

export function addSemesterToCourseDoc(courseDoc: string, semester: string) {
  const colon = courseDoc.indexOf(':');

  const left = colon === -1 ? courseDoc : courseDoc.slice(0, colon);
  const right = colon === -1 ? '' : courseDoc.slice(colon + 1);

  const leftNoTerm = left.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const newLeft = `${leftNoTerm} (${semester})`;

  const suffix = colon === -1 ? '' : ` : ${right.trim()}`;
  return `${newLeft}${suffix}`;
}
