/**
 * Migrate application `courses` maps from the legacy
 * `${code}__${classNumber}` keys to the new `${code} : ${instructor}`
 * keys that the auto-fetch runner and Excel uploader now produce.
 *
 * Why: until the (course, instructor) unification, semester course docs
 * were keyed by class number — one row per section. Apps captured that
 * key. After unification, picker selections and faculty roster lookups
 * use `${code} : ${instructor}`, so apps holding `__classNumber` keys
 * stop matching anything.
 *
 * Strategy:
 *   1. Index every `semesters/{sem}/courses/*` doc. The collection is
 *      now in transition — some docs may already be in the new format,
 *      some still in the legacy `__classNumber` shape. For new-format
 *      docs we record the (semester, code, classNumber) → newDocId map
 *      using the doc's `class_numbers[]`. For legacy docs we derive the
 *      new doc id from `professor_names`.
 *   2. For each application's `courses` map, walk the semester buckets
 *      and rewrite any `${code}__${classNumber}` key whose target we
 *      know. Skip if the new key is already present (don't clobber a
 *      status that may be further along).
 *
 * Idempotent. Safe to re-run. Dry by default.
 *
 * Usage:
 *   npm run migrate:application-course-keys-to-instructor:dry
 *   npm run migrate:application-course-keys-to-instructor
 *
 * Run BEFORE the semester-course backfill so this script can use the
 * legacy `__classNumber` docs to derive instructor names; if you've
 * already backfilled, this script still works via `class_numbers[]`.
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

function instructorKey(rawNames: unknown): string {
  const cleaned = String(rawNames ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'TBA';
}

function newDocId(code: string, instructor: string): string {
  return `${code} : ${instructor.replace(/\//g, '-')}`;
}

// (semester, code, classNumber) → new doc id
type Index = Map<string, Map<string, Map<string, string>>>;

function setIndex(
  idx: Index,
  semester: string,
  code: string,
  classNumber: string,
  newId: string
): void {
  let bySem = idx.get(semester);
  if (!bySem) {
    bySem = new Map();
    idx.set(semester, bySem);
  }
  let byCode = bySem.get(code);
  if (!byCode) {
    byCode = new Map();
    bySem.set(code, byCode);
  }
  byCode.set(classNumber, newId);
}

function lookupIndex(
  idx: Index,
  semester: string,
  code: string,
  classNumber: string
): string | null {
  return idx.get(semester)?.get(code)?.get(classNumber) ?? null;
}

async function buildIndex(db: any): Promise<Index> {
  const idx: Index = new Map();
  const groupSnap = await db.collectionGroup('courses').get();
  for (const doc of groupSnap.docs) {
    const semesterRef = doc.ref.parent.parent;
    if (!semesterRef || semesterRef.parent.id !== 'semesters') continue;
    const semester = semesterRef.id;
    const data = doc.data() as AnyMap;
    const code = String(data.code ?? '')
      .trim()
      .toUpperCase();
    if (!code) continue;

    const id = doc.id;
    const isNewFormat = id.includes(' : ');

    // Class numbers known for this row. Post-backfill docs carry the array;
    // legacy docs only have a single `class_number`.
    const classNumbers: string[] = [];
    if (Array.isArray(data.class_numbers)) {
      for (const cn of data.class_numbers) {
        const s = String(cn ?? '').trim();
        if (s) classNumbers.push(s);
      }
    }
    const single = String(data.class_number ?? data.classNumber ?? '').trim();
    if (single && !classNumbers.includes(single)) {
      // class_number may itself be comma-joined post-backfill.
      for (const piece of single.split(',')) {
        const p = piece.trim();
        if (p && !classNumbers.includes(p)) classNumbers.push(p);
      }
    }
    if (classNumbers.length === 0) continue;

    // Resolve the new doc id for this row. If the doc is already in the
    // new format use its id directly; otherwise construct it from
    // professor_names. Both routes converge on the same value when the
    // collection is fully migrated.
    const newId = isNewFormat
      ? id
      : newDocId(code, instructorKey(data.professor_names));

    for (const cn of classNumbers) {
      setIndex(idx, semester, code, cn, newId);
    }
  }
  return idx;
}

interface PlannedRewrite {
  appPath: string;
  semester: string;
  oldKey: string;
  newKey: string;
  status: string;
  conflict: 'none' | 'already-has-new-key';
}

interface UnmatchedKey {
  appPath: string;
  semester: string;
  oldKey: string;
}

function parseLegacyKey(
  key: string
): { code: string; classNumber: string } | null {
  const idx = key.indexOf('__');
  if (idx === -1) return null;
  const code = key.slice(0, idx).trim().toUpperCase();
  const classNumber = key.slice(idx + 2).trim();
  if (!code || !classNumber) return null;
  return { code, classNumber };
}

async function planAndApply(
  db: any,
  idx: Index
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
        // Already in the new format — leave alone.
        if (innerKey.includes(' : ')) continue;

        const parsed = parseLegacyKey(innerKey);
        if (!parsed) continue;

        const newId = lookupIndex(
          idx,
          semester,
          parsed.code,
          parsed.classNumber
        );
        if (!newId) {
          unmatched.push({
            appPath: appDoc.ref.path,
            semester,
            oldKey: innerKey,
          });
          continue;
        }
        if (newId === innerKey) continue;

        const conflict =
          typeof bucket[newId] === 'string' ? 'already-has-new-key' : 'none';

        rewrites.push({
          appPath: appDoc.ref.path,
          semester,
          oldKey: innerKey,
          newKey: newId,
          status,
          conflict,
        });

        updates[`courses.${semester}.${innerKey}`] =
          admin.firestore.FieldValue.delete();
        if (conflict === 'none') {
          updates[`courses.${semester}.${newId}`] = status;
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
    `application courses-key migration (→ instructor) — mode=${
      DRY ? 'DRY (no writes)' : 'EXECUTE'
    }`
  );

  const idx = await buildIndex(db);
  let entries = 0;
  idx.forEach((bySem) => bySem.forEach((byCode) => (entries += byCode.size)));
  console.log(
    `course index: ${idx.size} semester(s), ${entries} (code, classNumber) → newId entr(ies)`
  );

  const result = await planAndApply(db, idx);
  console.log(
    `\nsummary: scanned=${result.totalApps} apps, touched=${result.appsTouched} apps, rewrites=${result.rewrites.length}, unmatched legacy keys=${result.unmatched.length}`
  );

  if (result.unmatched.length > 0) {
    console.log('\nUnmatched legacy keys (no current course doc found):');
    for (const u of result.unmatched.slice(0, 50)) {
      console.log(
        `  app=${u.appPath}  semester="${u.semester}"  key="${u.oldKey}"`
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
