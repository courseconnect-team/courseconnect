// api/applications.ts
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import firebase from '@/firebase/firebase_config';

type ApproveParams = { documentId: string; classCode: string };
type DenyParams = ApproveParams & {
  name: string;
  uf_email: string;
  position: string;
};

const db = firebase.firestore();
// Optional: tiny helper to atomically set courses.<classCode> = status
async function setCourseStatusAtomic(
  documentId: string,
  classCode: string,
  status: 'accepted' | 'denied'
) {
  const ref = doc(db, 'applications', documentId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Application not found');

    // Optionally validate existing map:
    // const data = snap.data() as any;
    // const courses = data.courses ?? {};
    // if (courses[classCode] === status) return; // already set

    tx.update(ref, { [`courses.${classCode}`]: status });
  });
}

/** Approve: only sets the flag atomically */
export async function approveApplication({
  documentId,
  classCode,
}: ApproveParams) {
  await setCourseStatusAtomic(documentId, classCode, 'accepted');
  window.location.reload();

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

  // best-effort email (don’t block the user even if email fails)
  try {
    const res = await fetch(
      'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/sendEmail',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'applicationStatusDenied',
          data: {
            user: { name, email: uf_email },
            position,
            classCode,
          },
        }),
      }
    );
    window.location.reload();

    if (!res.ok) throw new Error(`Email failed: ${res.status}`);
  } catch (err) {
    // log and carry on
    console.error('Failed to send deny email:', err);
  }

  return { ok: true as const };
}
