// api/applications.ts
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

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
  status: 'approved' | 'denied'
) {
  const ref = db.collection('applications').doc(documentId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('Application not found');

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

export function addSemesterToCourseDoc(courseDoc: string, semester: string) {
  const colon = courseDoc.indexOf(':');

  const left = colon === -1 ? courseDoc : courseDoc.slice(0, colon);
  const right = colon === -1 ? '' : courseDoc.slice(colon + 1);

  const leftNoTerm = left.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const newLeft = `${leftNoTerm} (${semester})`;

  const suffix = colon === -1 ? '' : ` : ${right.trim()}`;
  return `${newLeft}${suffix}`;
}
