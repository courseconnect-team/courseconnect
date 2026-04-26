/**
 * Backfill `professor_usernames` on existing course docs.
 *
 * Faculty matching used to query by full email (`professor_emails`). It now
 * queries by the email's local part (`professor_usernames`) so a professor
 * who logs in with `john@ufl.edu` still matches a roster row of
 * `john@ece.ufl.edu`. New writes (Excel upload, auto-fetch, manual create,
 * admin edit) populate the field automatically; this script populates it on
 * everything written before the swap.
 *
 * Idempotent. Safe to re-run. Dry by default.
 *
 * Usage:
 *   npm run backfill:professor-usernames:dry   # default; prints intended writes
 *   npm run backfill:professor-usernames       # applies writes
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS to point at a service-account key.
 *
 * Scope: every doc under `semesters/{termId}/courses/*` plus the legacy flat
 * `courses/*` collection (still written by `processCreateCourseForm`).
 */

const admin = require('firebase-admin');

type AnyMap = Record<string, any>;

const DRY = !process.argv.includes('--execute');
const BATCH_SIZE = 400;

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'courseconnect-c6a7b',
    });
  }
  return admin.firestore();
}

function emailToUsername(email: unknown): string {
  if (typeof email !== 'string') return '';
  const at = email.indexOf('@');
  const local = at === -1 ? email : email.slice(0, at);
  return local.trim().toLowerCase();
}

function usernamesFromEmails(raw: unknown): string[] {
  // Course docs have stored `professor_emails` as either a string[] (Excel +
  // auto-fetch) or a semicolon-separated string (legacy past-courses migration).
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
    ? raw.split(/[;,]/).map((s) => s.trim())
    : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of list) {
    const u = emailToUsername(e);
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

interface Stats {
  scanned: number;
  skipped_no_emails: number;
  skipped_no_change: number;
  updated: number;
}

function newStats(): Stats {
  return {
    scanned: 0,
    skipped_no_emails: 0,
    skipped_no_change: 0,
    updated: 0,
  };
}

async function processDocs(
  db: any,
  docs: any[],
  label: string,
  stats: Stats
): Promise<void> {
  let batch = db.batch();
  let pending = 0;
  for (const doc of docs) {
    stats.scanned += 1;
    const data = doc.data() as AnyMap;
    const computed = usernamesFromEmails(data.professor_emails);
    if (computed.length === 0) {
      stats.skipped_no_emails += 1;
      continue;
    }
    const existing = Array.isArray(data.professor_usernames)
      ? (data.professor_usernames as string[]).filter(
          (u): u is string => typeof u === 'string'
        )
      : [];
    if (arraysEqual(existing, computed)) {
      stats.skipped_no_change += 1;
      continue;
    }
    console.log(
      `  ${label}  ${doc.ref.path}  emails=${JSON.stringify(
        data.professor_emails ?? null
      )}  -> usernames=${JSON.stringify(computed)}`
    );
    if (!DRY) {
      batch.set(doc.ref, { professor_usernames: computed }, { merge: true });
      pending += 1;
      if (pending >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
    stats.updated += 1;
  }
  if (!DRY && pending > 0) {
    await batch.commit();
  }
}

async function backfillSemesterCourses(db: any): Promise<Stats> {
  const stats = newStats();
  const groupSnap = await db.collectionGroup('courses').get();
  const semesterDocs = groupSnap.docs.filter(
    (d: any) => d.ref.parent.parent?.parent.id === 'semesters'
  );
  await processDocs(db, semesterDocs, 'sem', stats);
  return stats;
}

async function backfillFlatCourses(db: any): Promise<Stats> {
  const stats = newStats();
  const snap = await db.collection('courses').get();
  await processDocs(db, snap.docs, 'flat', stats);
  return stats;
}

function printStats(label: string, stats: Stats): void {
  console.log(
    `\n[${label}] scanned=${stats.scanned}  updated=${stats.updated}  skipped_no_change=${stats.skipped_no_change}  skipped_no_emails=${stats.skipped_no_emails}`
  );
}

async function main() {
  const db = init();
  console.log(
    `professor_usernames backfill — mode=${DRY ? 'DRY (no writes)' : 'EXECUTE'}`
  );

  const semStats = await backfillSemesterCourses(db);
  printStats('semesters/*/courses', semStats);

  const flatStats = await backfillFlatCourses(db);
  printStats('courses (legacy flat)', flatStats);

  console.log(
    DRY
      ? '\nDry run complete. Re-run with --execute to apply.'
      : '\nBackfill complete.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
