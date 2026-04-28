/**
 * Backfill `semesters/{Sem}/courses/*` doc ids from the legacy
 * `${code}__${classNumber}` (one per section) shape to the canonical
 * `${code} : ${instructor}` (one per professor + course) shape that the
 * auto-fetch runner and Excel uploader now write.
 *
 * For each (semester, code, instructor) group, this:
 *   1. Builds a merged doc — `class_numbers` array, comma-joined
 *      `class_number` for back-compat, summed `enrollment_cap` /
 *      `enrolled`, concatenated `meeting_times`, plus `section_count`.
 *   2. Writes the merged doc at `${code} : ${instructor}` (merge: true,
 *      so existing rows for that prof are preserved).
 *   3. Deletes the originals.
 *
 * Idempotent: docs already in `${code} : ${instructor}` form are left
 * alone. Safe to re-run.
 *
 * Run AFTER the application-key migration so apps still resolve their
 * legacy `__classNumber` keys against the per-section docs.
 *
 * Usage:
 *   npm run backfill:semester-course-docs:dry    # default; prints planned writes
 *   npm run backfill:semester-course-docs        # applies writes
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

// Mirror of `instructorKeyFromSection` in
// `functions/src/courseFetcher/runner.ts` — kept here so the script stays
// dependency-free and matches whatever format the runner writes.
function instructorKey(rawNames: unknown): string {
  const cleaned = String(rawNames ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'TBA';
}

function safeDocSegment(s: string): string {
  // Firestore doc ids cannot contain '/'. Other punctuation is fine.
  return s.replace(/\//g, '-');
}

function newDocId(code: string, instructor: string): string {
  return `${code} : ${safeDocSegment(instructor)}`;
}

function isLegacyDocId(id: string): boolean {
  // New format always contains ' : ' — skip those.
  return !id.includes(' : ') && id.includes('__');
}

function sumNumeric(values: unknown[]): { value: number; any: boolean } {
  let total = 0;
  let any = false;
  for (const v of values) {
    if (v == null || v === '' || v === 'undef') continue;
    const n = Number(v);
    if (Number.isFinite(n)) {
      total += n;
      any = true;
    }
  }
  return { value: total, any };
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

interface LegacyDoc {
  // Loose-typed to keep this script dependency-free; the rest of the
  // script only calls .delete() / .set() / .path on the ref.
  ref: any;
  id: string;
  data: AnyMap;
}

function mergeGroup(
  semester: string,
  code: string,
  instructor: string,
  sources: LegacyDoc[]
): AnyMap {
  // Pick a "head" source for fields that don't naturally combine — title,
  // credits, department. The runner writes these the same for every section
  // of a given course, so there's no real choice involved.
  const head = sources[0].data;

  const classNumbers: string[] = [];
  const meetingTimes: AnyMap[] = [];
  const allEmails: string[] = [];
  const enrollmentCap: unknown[] = [];
  const enrolled: unknown[] = [];
  let sectionCountAccum = 0;

  for (const src of sources) {
    const d = src.data;
    const cn = String(d.class_number ?? d.classNumber ?? '').trim();
    if (cn && !classNumbers.includes(cn)) classNumbers.push(cn);
    for (const mt of asArray<AnyMap>(d.meeting_times)) {
      meetingTimes.push(mt);
    }
    for (const e of asArray<string>(d.professor_emails)) {
      const trimmed = String(e ?? '').trim();
      if (trimmed && !allEmails.includes(trimmed)) allEmails.push(trimmed);
    }
    enrollmentCap.push(d.enrollment_cap);
    enrolled.push(d.enrolled);
    // If a doc is itself a previously-merged shape (has section_count),
    // honor it; otherwise count this doc as one section.
    const existingCount = Number(d.section_count);
    sectionCountAccum +=
      Number.isFinite(existingCount) && existingCount > 0 ? existingCount : 1;
  }

  const capSum = sumNumeric(enrollmentCap);
  const enrSum = sumNumeric(enrolled);

  return {
    code,
    codeWithSpace: head.codeWithSpace ?? '',
    title: head.title ?? '',
    credits: head.credits ?? '',
    department: head.department ?? '',
    department_name: head.department_name ?? '',
    professor_names: instructor,
    professor_emails: allEmails,
    professor_usernames: allEmails
      .map((e) =>
        e.includes('@') ? e.slice(0, e.indexOf('@')).toLowerCase() : ''
      )
      .filter(Boolean),
    class_number: classNumbers.join(', '),
    class_numbers: classNumbers,
    enrollment_cap: capSum.any
      ? String(capSum.value)
      : head.enrollment_cap ?? '',
    enrolled: enrSum.any ? String(enrSum.value) : head.enrolled ?? '',
    title_section: head.title_section ?? '',
    section_count: sectionCountAccum,
    semester,
    meeting_times: meetingTimes,
    // Carry over `source` from whatever wrote these — auto-fetch and
    // excel-upload both used `__classNumber` ids in the past.
    source: head.source ?? 'auto-fetch',
    sourceConfigId: head.sourceConfigId,
    sourceProvider: head.sourceProvider,
    backfilled_at: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function planAndApply(db: any): Promise<{
  scanned: number;
  legacy: number;
  groups: number;
  written: number;
  deleted: number;
  skippedNoCode: number;
}> {
  const semestersSnap = await db.collection('semesters').get();
  let scanned = 0;
  let legacy = 0;
  let groups = 0;
  let written = 0;
  let deleted = 0;
  let skippedNoCode = 0;

  for (const semDoc of semestersSnap.docs) {
    const semester = semDoc.id;
    const coursesSnap = await semDoc.ref.collection('courses').get();
    if (coursesSnap.empty) continue;

    // Group legacy docs by (code, instructor).
    type GroupKey = string;
    const groupsByKey = new Map<
      GroupKey,
      { code: string; instructor: string; docs: LegacyDoc[] }
    >();
    for (const doc of coursesSnap.docs) {
      scanned++;
      const id = doc.id;
      if (!isLegacyDocId(id)) continue;
      const data = doc.data() as AnyMap;
      const code = String(data.code ?? '')
        .trim()
        .toUpperCase();
      if (!code) {
        skippedNoCode++;
        continue;
      }
      legacy++;
      const instructor = instructorKey(data.professor_names);
      const key = `${code}|${instructor}`;
      let group = groupsByKey.get(key);
      if (!group) {
        group = { code, instructor, docs: [] };
        groupsByKey.set(key, group);
      }
      group.docs.push({ ref: doc.ref, id, data });
    }

    if (groupsByKey.size === 0) continue;

    console.log(
      `\n[${semester}] ${groupsByKey.size} group(s) from ${legacy} legacy doc(s)`
    );

    // Materialize entries first — direct Map iteration needs ES2015+ and
    // the script's effective tsconfig is the Next-app one (target ES5).
    const groupEntries = Array.from(groupsByKey.values());
    for (const group of groupEntries) {
      groups++;
      const targetId = newDocId(group.code, group.instructor);
      const targetRef = semDoc.ref.collection('courses').doc(targetId);
      const merged = mergeGroup(
        semester,
        group.code,
        group.instructor,
        group.docs
      );

      console.log(
        `  ${group.code} : ${group.instructor}  ←  ${group.docs
          .map((d: LegacyDoc) => d.id)
          .join(', ')}  → ${targetId}`
      );

      if (DRY) continue;

      // 1) write merged doc (merge:true so an existing prof row isn't lost)
      await targetRef.set(merged, { merge: true });
      written++;
      // 2) delete originals — but only if their id != targetId (defensive)
      for (const src of group.docs) {
        if (src.ref.path === targetRef.path) continue;
        await src.ref.delete();
        deleted++;
      }
    }
  }

  return { scanned, legacy, groups, written, deleted, skippedNoCode };
}

async function main() {
  const db = init();
  console.log(
    `semester course-doc backfill — mode=${DRY ? 'DRY (no writes)' : 'EXECUTE'}`
  );
  const result = await planAndApply(db);
  console.log(
    `\nsummary: scanned=${result.scanned} legacy=${result.legacy} groups=${result.groups} written=${result.written} deleted=${result.deleted} skippedNoCode=${result.skippedNoCode}`
  );
  console.log(
    DRY
      ? '\nDry run complete. Re-run with --execute to apply.'
      : '\nBackfill complete.'
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
