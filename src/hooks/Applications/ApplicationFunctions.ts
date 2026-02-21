// api/applications.ts
import { getFirestore } from 'firebase/firestore';
import { ApplicationRepository } from '@/firebase/applications/applicationRepository';
import { callFunction } from '@/firebase/functions/callFunction';

type ApproveParams = { documentId: string; classCode: string };
type DenyParams = ApproveParams & {
  name: string;
  uf_email: string;
  position: string;
};

const db = getFirestore();
const repo = new ApplicationRepository(db);

// Atomically set courses.<classCode> = status on user's canonical course_assistant application
async function setCourseStatusAtomic(
  documentId: string,
  classCode: string,
  status: 'approved' | 'denied'
) {
  // documentId is userId in the applications/{type}/uid/{uid} schema
  await repo.updateCourseStatusLatest(documentId, classCode, status);
}

/** Approve: only sets the flag atomically */
export async function approveApplication({
  documentId,
  classCode,
}: ApproveParams) {
  await setCourseStatusAtomic(documentId, classCode, 'approved');
  return { ok: true as const };
}

/** Deny: set flag first, then attempt to send email */
export async function denyApplication({
  documentId,
  classCode,
  name,
  uf_email,
  position,
}: DenyParams) {
  await setCourseStatusAtomic(documentId, classCode, 'denied');

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
