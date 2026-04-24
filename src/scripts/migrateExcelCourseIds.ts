/**
 * Migrate legacy Excel-style course doc ids to the canonical
 * `${code}__${classNumber}` shape used by the auto-fetch pipeline.
 *
 * Background: Excel uploads used to key `semesters/{sem}/courses/*` docs as
 * `${Course} : ${Instructor}` (e.g. "COP 3502 : John Smith") while the
 * auto-fetch pipeline writes `${code}__${classNumber}` (e.g. "COP3502__12345").
 * Same underlying course produced two docs. After this migration both writers
 * land on the same id so re-runs merge instead of duplicating.
 *
 * Step 1 rewrites course doc ids. Step 2 rewrites the matching keys inside
 * `applications/{id}.courses[semester]` so existing submitted applications
 * still point at the right course.
 *
 * Usage:
 *   npm run migrate:course-ids:dry      # default; prints planned writes
 *   npm run migrate:course-ids          # applies the plan (pass --execute)
 *   npm run migrate:course-ids -- --courses-only
 *   npm run migrate:course-ids -- --apps-only
 *
 * Idempotent: docs already keyed by `${code}__${classNumber}` are left alone.
 * Requires GOOGLE_APPLICATION_CREDENTIALS to point at a service-account key.
 */

import * as admin from 'firebase-admin';

type AnyMap = Record<string, any>;

const DRY = !process.argv.includes('--execute');
const COURSES_ONLY = process.argv.includes('--courses-only');
const APPS_ONLY = process.argv.includes('--apps-only');
const DO_COURSES = !APPS_ONLY;
const DO_APPS = !COURSES_ONLY;
const BATCH_LIMIT = 400;

const CANONICAL_ID_RE = /^[A-Z0-9]+__\S+$/;

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  return admin.firestore();
}

function normalizeCode(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\s+/g, '')
    .trim()
    .toUpperCase();
}

function addCodeSpace(code: string): string {
  const m = code.match(/^([A-Z]{2,4})(\d{3,4}[A-Z]?)$/);
  return m ? `${m[1]} ${m[2]}` : code;
}

function canonicalId(code: string, classNumber: string): string {
  return `${code}__${classNumber}`;
}

type OldToNew = Map<string, string>; // oldId -> newId
type SemesterRewrites = Map<string, OldToNew>; // semester -> map

async function migrateCourses(
  db: admin.firestore.Firestore
): Promise<SemesterRewrites> {
  const rewrites: SemesterRewrites = new Map();
  const semesters = await db.collection('semesters').get();

  let scanned = 0;
  let alreadyCanonical = 0;
  let rewritten = 0;
  let skippedMissingFields = 0;
  let skippedIdCollision = 0;

  for (const semDoc of semesters.docs) {
    const semesterId = semDoc.id;
    const coursesRef = semDoc.ref.collection('courses');
    const snap = await coursesRef.get();

    let batch = db.batch();
    let batchOps = 0;
    const flush = async () => {
      if (batchOps === 0) return;
      if (!DRY) await batch.commit();
      batch = db.batch();
      batchOps = 0;
    };

    for (const doc of snap.docs) {
      scanned++;
      const oldId = doc.id;
      if (CANONICAL_ID_RE.test(oldId)) {
        alreadyCanonical++;
        continue;
      }
      const data = doc.data() as AnyMap;
      const code = normalizeCode(data.code);
      const classNumber = String(data.class_number ?? '').trim();
      if (!code || !classNumber) {
        skippedMissingFields++;
        console.warn(
          `[SKIP] semesters/${semesterId}/courses/${oldId} — missing code or class_number`
        );
        continue;
      }
      const newId = canonicalId(code, classNumber);
      if (newId === oldId) {
        alreadyCanonical++;
        continue;
      }

      const destRef = coursesRef.doc(newId);
      const destSnap = await destRef.get();
      if (destSnap.exists && destSnap.id !== oldId) {
        // Canonical doc already exists (likely from auto-fetch). Merge the
        // old data into it so nothing is lost, then delete the old shell.
        console.log(
          `[MERGE] semesters/${semesterId}/courses/${oldId} → ${newId} (destination exists)`
        );
      } else {
        console.log(
          `[COPY] semesters/${semesterId}/courses/${oldId} → ${newId}`
        );
      }

      const normalizedData = {
        ...data,
        code,
        codeWithSpace: data.codeWithSpace ?? addCodeSpace(code),
        class_number: classNumber,
        semester: data.semester ?? semesterId,
      };

      if (!DRY) {
        batch.set(destRef, normalizedData, { merge: true });
        batch.delete(doc.ref);
        batchOps += 2;
        if (batchOps >= BATCH_LIMIT) await flush();
      }
      rewritten++;

      let bucket = rewrites.get(semesterId);
      if (!bucket) {
        bucket = new Map();
        rewrites.set(semesterId, bucket);
      }
      if (bucket.has(oldId) && bucket.get(oldId) !== newId) {
        skippedIdCollision++;
      }
      bucket.set(oldId, newId);
    }

    await flush();
  }

  console.log(
    `\n[courses] scanned=${scanned} canonical=${alreadyCanonical} rewritten=${rewritten} skippedMissingFields=${skippedMissingFields} collisions=${skippedIdCollision}`
  );
  return rewrites;
}

async function migrateApplications(
  db: admin.firestore.Firestore,
  rewrites: SemesterRewrites
): Promise<void> {
  if (rewrites.size === 0) {
    console.log('[apps] no course rewrites collected — nothing to remap');
    return;
  }

  const snap = await db.collection('applications').get();
  let scanned = 0;
  let rewritten = 0;
  let noop = 0;

  let batch = db.batch();
  let batchOps = 0;
  const flush = async () => {
    if (batchOps === 0) return;
    if (!DRY) await batch.commit();
    batch = db.batch();
    batchOps = 0;
  };

  for (const doc of snap.docs) {
    scanned++;
    const data = doc.data() as AnyMap;
    const courses = data.courses as
      | Record<string, Record<string, string>>
      | undefined;
    if (!courses || typeof courses !== 'object') {
      noop++;
      continue;
    }

    const nextCourses: Record<string, Record<string, string>> = {};
    let changed = false;

    for (const [sem, bucket] of Object.entries(courses)) {
      if (!bucket || typeof bucket !== 'object') continue;
      const semRewrites = rewrites.get(sem);
      const nextBucket: Record<string, string> = {};
      for (const [oldKey, status] of Object.entries(bucket)) {
        const mapped = semRewrites?.get(oldKey);
        if (mapped && mapped !== oldKey) {
          nextBucket[mapped] = status;
          changed = true;
        } else {
          nextBucket[oldKey] = status;
        }
      }
      nextCourses[sem] = nextBucket;
    }

    if (!changed) {
      noop++;
      continue;
    }

    console.log(`[REMAP] applications/${doc.id}`);
    if (!DRY) {
      batch.update(doc.ref, { courses: nextCourses });
      batchOps++;
      if (batchOps >= BATCH_LIMIT) await flush();
    }
    rewritten++;
  }

  await flush();

  console.log(
    `\n[apps] scanned=${scanned} rewritten=${rewritten} noop=${noop}`
  );
}

async function main() {
  console.log(
    `${DRY ? '[DRY RUN]' : '[EXECUTE]'} migrate legacy Excel course doc ids`
  );
  const db = init();

  const rewrites = DO_COURSES
    ? await migrateCourses(db)
    : new Map<string, OldToNew>();

  if (DO_APPS) {
    await migrateApplications(db, rewrites);
  }

  console.log(`\nDone. ${DRY ? 'No writes performed.' : 'Changes committed.'}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
