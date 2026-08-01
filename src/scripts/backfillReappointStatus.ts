/**
 * Backfill `requested_action` on `assignments` docs to `REAPPOINT` for people
 * who are returning from a previous semester.
 *
 * Context: when a new semester's assignments are imported, every row defaults
 * to `NEW HIRE`. But anyone who held an assignment in an *earlier* semester is
 * really a re-appointment. This script finds those people and flips the newly
 * imported rows from `NEW HIRE` → `REAPPOINT`.
 *
 * How it works:
 *   1. Read every doc in the top-level `assignments` collection.
 *   2. Identify each person by UFID (falling back to lowercased email, then
 *      lowercased name) and record the set of semesters they appear in.
 *   3. For each assignment in the TARGET semester, if that same person also
 *      appears in any *chronologically earlier* semester, mark it REAPPOINT.
 *
 * Safety:
 *   - Only rows whose current action is unset or `NEW HIRE` are touched.
 *     Manual `REAPPOINT` / `TERMINATE` / `LEAVE` / `OPS SEMESTER BREAK` values
 *     are left alone. Pass `--force` to override any non-REAPPOINT value.
 *   - Dry-run by default; prints every planned change. Pass `--execute` to
 *     apply. Idempotent — safe to re-run.
 *
 * Usage:
 *   # target semester auto-detected as the latest semester found in the data:
 *   ts-node src/scripts/backfillReappointStatus.ts            # dry run
 *   ts-node src/scripts/backfillReappointStatus.ts --execute  # apply
 *
 *   # pin the target semester explicitly (must match the stored string):
 *   ts-node src/scripts/backfillReappointStatus.ts --semester "Fall 2026"
 *   ts-node src/scripts/backfillReappointStatus.ts --semester "Fall 2026" --execute
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS to point at a service-account key.
 */

const admin = require('firebase-admin');

type AnyMap = Record<string, any>;

const DRY = !process.argv.includes('--execute');
const FORCE = process.argv.includes('--force');

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && i + 1 < process.argv.length) return process.argv[i + 1];
  return undefined;
}
const TARGET_SEMESTER = argValue('--semester');

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'courseconnect-c6a7b',
    });
  }
  const db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

// --- semester ordering ------------------------------------------------------
// Stored semester strings look like "Fall 2025", "Spring 2026", "Summer 2024".
// Rank chronologically: Spring < Summer < Fall within a year.
const TERM_ORDER: Record<string, number> = { spring: 0, summer: 1, fall: 2 };

function semesterRank(sem: string): number | null {
  const s = sem.trim().toLowerCase();
  const term = Object.keys(TERM_ORDER).find((t) => s.includes(t));
  const yearMatch = s.match(/\b(\d{4})\b/);
  if (!term || !yearMatch) return null;
  return Number(yearMatch[1]) * 10 + TERM_ORDER[term];
}

function normalizeSemesters(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
  return [];
}

// --- person identity --------------------------------------------------------
function personKey(d: AnyMap): string | null {
  const ufid = String(d.ufid ?? d.UFID ?? '').trim();
  if (ufid) return `ufid:${ufid}`;
  const email = String(d.email ?? '').trim().toLowerCase();
  if (email) return `email:${email}`;
  const name = String(d.name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (name) return `name:${name}`;
  return null;
}

async function planAndApply(db: any) {
  const snap = await db.collection('assignments').get();

  // Pass 1: build person → set of semester ranks they appear in.
  const personSemRanks = new Map<string, Set<number>>();
  const allSemesters = new Set<string>();

  const rows = snap.docs.map((doc: any) => {
    const d = doc.data() as AnyMap;
    const semesters = normalizeSemesters(d.semesters);
    semesters.forEach((s) => allSemesters.add(s));
    const key = personKey(d);
    if (key) {
      const ranks = personSemRanks.get(key) ?? new Set<number>();
      for (const s of semesters) {
        const r = semesterRank(s);
        if (r != null) ranks.add(r);
      }
      personSemRanks.set(key, ranks);
    }
    return { ref: doc.ref, id: doc.id, d, semesters, key };
  });

  // Resolve the target semester.
  const target = TARGET_SEMESTER ?? latestSemester(allSemesters);
  if (!target) {
    throw new Error(
      'Could not determine a target semester. Pass --semester "Fall 2026".'
    );
  }
  const targetRank = semesterRank(target);
  if (targetRank == null) {
    throw new Error(
      `Target semester "${target}" is not a recognizable "Term YYYY" string.`
    );
  }

  console.log(
    `Semesters found in data: ${Array.from(allSemesters)
      .sort((a, b) => (semesterRank(a) ?? 0) - (semesterRank(b) ?? 0))
      .join(', ')}`
  );
  console.log(`Target (new) semester: "${target}"\n`);

  // Pass 2: for each assignment in the target semester, decide REAPPOINT.
  let inTarget = 0;
  let toUpdate = 0;
  let skippedNoPriorSemester = 0;
  let skippedNonNewHire = 0;

  const updates: { ref: any; id: string; from: string; name: string }[] = [];

  for (const row of rows) {
    if (!row.semesters.includes(target)) continue;
    inTarget++;

    const current = String(row.d.requested_action ?? '').trim() || 'NEW HIRE';
    // Already a reappoint — nothing to do.
    if (current.toUpperCase() === 'REAPPOINT') continue;
    // Preserve manual overrides unless --force.
    if (!FORCE && current.toUpperCase() !== 'NEW HIRE') {
      skippedNonNewHire++;
      continue;
    }

    const ranks = row.key ? personSemRanks.get(row.key) : undefined;
    const hasEarlier =
      ranks && Array.from(ranks).some((r) => r < targetRank);
    if (!hasEarlier) {
      skippedNoPriorSemester++;
      continue;
    }

    toUpdate++;
    updates.push({
      ref: row.ref,
      id: row.id,
      from: current,
      name: String(row.d.name ?? row.d.email ?? row.d.ufid ?? row.id),
    });
  }

  for (const u of updates) {
    console.log(`  ${u.name}  [${u.id}]  ${u.from} → REAPPOINT`);
  }

  if (!DRY && updates.length) {
    // Firestore batches cap at 500 writes.
    for (let i = 0; i < updates.length; i += 450) {
      const batch = db.batch();
      for (const u of updates.slice(i, i + 450)) {
        batch.update(u.ref, { requested_action: 'REAPPOINT' });
      }
      await batch.commit();
    }
  }

  return {
    scanned: rows.length,
    inTarget,
    toUpdate,
    skippedNoPriorSemester,
    skippedNonNewHire,
  };
}

function latestSemester(all: Set<string>): string | null {
  let best: string | null = null;
  let bestRank = -Infinity;
  Array.from(all).forEach((s) => {
    const r = semesterRank(s);
    if (r != null && r > bestRank) {
      bestRank = r;
      best = s;
    }
  });
  return best;
}

async function main() {
  const db = init();
  console.log(
    `reappoint-status backfill — mode=${DRY ? 'DRY (no writes)' : 'EXECUTE'}${
      FORCE ? ' --force' : ''
    }\n`
  );
  const r = await planAndApply(db);
  console.log(
    `\nsummary: scanned=${r.scanned} inTargetSemester=${r.inTarget} ` +
      `willReappoint=${r.toUpdate} skipped(noPriorSemester)=${r.skippedNoPriorSemester} ` +
      `skipped(manualAction)=${r.skippedNonNewHire}`
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
