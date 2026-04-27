/**
 * Migrate application `courses` maps from the legacy course-id format
 * (`${code} : ${instructor}`) to the canonical `${code}__${classNumber}` shape
 * used by the current `semesters/{sem}/courses/{id}` docs.
 *
 * Why: until commit 54ef90f the picker built course ids by combining the
 * course code with the instructor name. After unification, every course doc
 * id is `${code}__${classNumber}`. Applications submitted before the swap
 * still hold legacy keys, so faculty pages keyed on the new doc id (e.g.
 * `applications/Spring 2026/EEL3111C__10747`) only see students whose entry
 * was already written in the new format.
 *
 * Strategy:
 *   1. Index every `semesters/{sem}/courses/*` doc by `(semester, code,
 *      professor_names)` so we can look up the new doc id from a legacy key.
 *   2. For each application's `courses` map, walk semester buckets and
 *      rewrite `${code} : ${instructor}` keys to the corresponding
 *      `${code}__{classNumber}`. Skip if the new key is already present.
 *   3. Bare-flat keys (no semester bucket) are reported but not migrated —
 *      they have no semester context to match against. There are few of
 *      them and faculty don't filter through that path today.
 *
 * Idempotent. Safe to re-run. Dry by default.
 *
 * Usage:
 *   npm run migrate:application-course-keys:dry    # default; prints planned writes
 *   npm run migrate:application-course-keys        # applies writes
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS to point at a service-account key.
 */

const admin = require('firebase-admin');

type AnyMap = Record<string, any>;

const DRY = !process.argv.includes('--execute');

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'courseconnect-c6a7b',
    });
  }
  return admin.firestore();
}

function normName(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

interface IndexEntry {
  docId: string;
  instructor: string;
  classNumber: string;
}

type SemesterCourseIndex = Map<string, Map<string, IndexEntry[]>>;

async function buildCourseIndex(db: any): Promise<SemesterCourseIndex> {
  const idx: SemesterCourseIndex = new Map();
  const groupSnap = await db.collectionGroup('courses').get();
  for (const doc of groupSnap.docs) {
    const semesterRef = doc.ref.parent.parent;
    if (!semesterRef || semesterRef.parent.id !== 'semesters') continue;
    const semester = semesterRef.id;
    const data = doc.data() as AnyMap;
    const code = String(data.code ?? '')
      .trim()
      .toUpperCase();
    const classNumber = String(
      data.class_number ?? data.classNumber ?? ''
    ).trim();
    if (!code) continue;
    // Only index canonical doc ids; legacy `${code} (${semester}) : ${name}`
    // docs in the flat `courses/*` collection don't go through this path.
    if (!doc.id.includes('__')) continue;

    let bySem = idx.get(semester);
    if (!bySem) {
      bySem = new Map();
      idx.set(semester, bySem);
    }
    let byCode = bySem.get(code);
    if (!byCode) {
      byCode = [];
      bySem.set(code, byCode);
    }
    byCode.push({
      docId: doc.id,
      instructor: normName(data.professor_names),
      classNumber,
    });
  }
  return idx;
}

interface PlannedRewrite {
  appId: string;
  semester: string;
  oldKey: string;
  newKey: string;
  status: string;
  conflict: 'none' | 'already-has-new-key';
}

interface UnmatchedKey {
  appId: string;
  semester: string;
  oldKey: string;
}

function parseLegacyKey(
  key: string
): { code: string; instructor: string } | null {
  // Legacy form: `${code} : ${instructor}`. Use the FIRST `:` only — instructor
  // names sometimes contain colons (rare, but cheap to be safe).
  const idx = key.indexOf(' : ');
  if (idx === -1) return null;
  const code = key.slice(0, idx).trim().toUpperCase();
  const instructor = key.slice(idx + 3).trim();
  if (!code) return null;
  return { code, instructor };
}

function findMatch(
  entries: IndexEntry[],
  legacyInstructor: string
): IndexEntry | null {
  if (entries.length === 0) return null;
  const target = normName(legacyInstructor);
  if (!target) return entries.length === 1 ? entries[0] : null;

  // Exact match first.
  const exact = entries.find((e) => e.instructor === target);
  if (exact) return exact;

  // Substring match either direction (handles multi-instructor course docs
  // whose `professor_names` is e.g. "A, B" but the legacy key only has "A").
  const contains = entries.find(
    (e) => e.instructor.includes(target) || target.includes(e.instructor)
  );
  if (contains) return contains;

  // Last-name fallback: legacy "Rambo,Keith Jeffrey" → token "rambo".
  const lastName = target.split(',')[0]?.trim();
  if (lastName) {
    const byLast = entries.find((e) => e.instructor.includes(lastName));
    if (byLast) return byLast;
  }

  return null;
}

async function planAndApply(
  db: any,
  idx: SemesterCourseIndex
): Promise<{
  rewrites: PlannedRewrite[];
  unmatched: UnmatchedKey[];
  totalApps: number;
  appsTouched: number;
}> {
  const appsCol = db
    .collection('applications')
    .doc('course_assistant')
    .collection('uid');
  const snap = await appsCol.get();
  const rewrites: PlannedRewrite[] = [];
  const unmatched: UnmatchedKey[] = [];
  let appsTouched = 0;

  for (const appDoc of snap.docs) {
    const data = appDoc.data() as AnyMap;
    const courses = data.courses;
    if (!courses || typeof courses !== 'object') continue;

    const updates: Record<string, any> = {};
    let touched = false;

    for (const [topKey, topVal] of Object.entries(courses)) {
      if (!topVal || typeof topVal !== 'object') continue;
      const semester = topKey;
      const bucket = topVal as Record<string, unknown>;

      for (const [innerKey, status] of Object.entries(bucket)) {
        if (typeof status !== 'string') continue;
        if (innerKey.includes('__')) continue; // already canonical

        const parsed = parseLegacyKey(innerKey);
        if (!parsed) continue;

        const semIdx = idx.get(semester);
        const codeEntries = semIdx?.get(parsed.code) ?? [];
        const match = findMatch(codeEntries, parsed.instructor);

        if (!match) {
          unmatched.push({ appId: appDoc.id, semester, oldKey: innerKey });
          continue;
        }
        if (match.docId === innerKey) continue;

        const conflict =
          typeof bucket[match.docId] === 'string'
            ? 'already-has-new-key'
            : 'none';

        rewrites.push({
          appId: appDoc.id,
          semester,
          oldKey: innerKey,
          newKey: match.docId,
          status,
          conflict,
        });

        // Always delete the legacy key. Set the new key only if it isn't
        // already present (don't clobber a status that's further along).
        updates[`courses.${semester}.${innerKey}`] =
          admin.firestore.FieldValue.delete();
        if (conflict === 'none') {
          updates[`courses.${semester}.${match.docId}`] = status;
        }
        touched = true;
      }
    }

    if (touched) {
      appsTouched += 1;
      console.log(`  ${appDoc.id}  ${Object.keys(updates).length} field op(s)`);
      for (const [k, v] of Object.entries(updates)) {
        console.log(`    ${k} = ${typeof v === 'string' ? v : '<DELETE>'}`);
      }
      if (!DRY) {
        await appDoc.ref.update(updates);
      }
    }
  }

  return { rewrites, unmatched, totalApps: snap.size, appsTouched };
}

async function main() {
  const db = init();
  console.log(
    `application courses-key migration — mode=${
      DRY ? 'DRY (no writes)' : 'EXECUTE'
    }`
  );

  const idx = await buildCourseIndex(db);
  let coursesIndexed = 0;
  idx.forEach((bySem) =>
    bySem.forEach((arr) => (coursesIndexed += arr.length))
  );
  console.log(
    `course index: ${idx.size} semester(s), ${coursesIndexed} course doc(s)`
  );

  const result = await planAndApply(db, idx);
  console.log(
    `\nsummary: scanned=${result.totalApps} apps, touched=${result.appsTouched} apps, rewrites=${result.rewrites.length}, unmatched legacy keys=${result.unmatched.length}`
  );

  if (result.unmatched.length > 0) {
    console.log('\nUnmatched legacy keys (no current course doc found):');
    for (const u of result.unmatched.slice(0, 50)) {
      console.log(
        `  app=${u.appId}  semester="${u.semester}"  key="${u.oldKey}"`
      );
    }
    if (result.unmatched.length > 50) {
      console.log(`  ... and ${result.unmatched.length - 50} more`);
    }
  }

  console.log(
    DRY
      ? '\nDry run complete. Re-run with --execute to apply.'
      : '\nMigration complete.'
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
