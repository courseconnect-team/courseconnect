import * as admin from 'firebase-admin';

const DRY = process.argv.includes('--dry');
const DELETE_OLD = process.argv.includes('--delete-old');
const OVERWRITE = process.argv.includes('--overwrite'); // upsert even if dest exists
const BATCH_SIZE = 400;

type AnyMap = Record<string, any>;

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  return admin.firestore();
}

async function ensureSemesterDoc(
  db: admin.firestore.Firestore,
  termId: string
) {
  const ref = db.collection('semesters').doc(termId);
  const snap = await ref.get();
  if (!snap.exists && !DRY) {
    // Create a minimal parent doc; collections auto-create on first child doc anyway.
    await ref.set({ autoCreated: true }, { merge: true });
  }
}

async function migrate() {
  const db = init();
  const srcCol = db.collection('past-courses');
  let lastId: string | null = null;

  let done = false;
  let total = 0,
    migrated = 0,
    skipped = 0,
    existed = 0,
    deleted = 0;

  while (!done) {
    let q = srcCol
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(BATCH_SIZE);
    if (lastId) q = q.startAfter(lastId);

    const snap = await q.get();
    if (snap.empty) {
      break;
    }
    const batch = db.batch();

    for (const doc of snap.docs) {
      total++;
      const data = doc.data() as AnyMap;
      const rawTerm = data.semester;
      const termId = rawTerm == null ? null : String(rawTerm);
      const newId = doc.id
        .replace(/\s*\([^)]*\)\s*/g, ' ') // remove "(...)"
        .replace(/\s{2,}/g, ' ') // collapse extra spaces
        .trim();

      if (!termId) {
        skipped++;
        console.warn(
          `[SKIP] ${doc.id}: missing 'semester' (or 'termId') field`
        );
        continue;
      }

      const destRef = db
        .collection('semesters')
        .doc(termId)
        .collection('courses')
        .doc(newId);

      if (!OVERWRITE && !DRY) {
        const exists = await destRef.get().then((s) => s.exists);
        if (exists) {
          existed++;
          continue;
        }
      }
      if (typeof data.professor_emails === 'string') {
        const names = data.professor_emails.split(/\s*;\s*/).filter(Boolean);
        data.professor_emails = names;
      }
      if (!DRY) await ensureSemesterDoc(db, termId);

      if (DRY) {
        console.log(
          `[DRY COPY] courses/${doc.id} → semesters/${termId}/courses/${doc.id}`
        );
      } else {
        batch.set(destRef, data, { merge: true });
        migrated++;
        if (DELETE_OLD) {
          batch.delete(doc.ref);
          deleted++;
        }
      }
    }
    if (!DRY) await batch.commit();

    lastId = snap.docs[snap.docs.length - 1].id;
    if (snap.size < BATCH_SIZE) done = true;
  }
}
migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
