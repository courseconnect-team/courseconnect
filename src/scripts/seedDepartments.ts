/**
 * Seed the three initial Course Connect departments (ECE, CISE, MAE).
 *
 * Part of Unit 2 of the multi-department support plan. Idempotent — re-running
 * skips docs that already exist.
 *
 * Usage:
 *   npm run seed:departments:dry        # prints intended writes
 *   npm run seed:departments -- --execute
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS to point to a service account key
 * with Firestore write access (same as migrateApplications.ts).
 *
 * Co-located with other scripts in src/scripts/ so the existing npm-script
 * pattern works. The multi-dept plan originally proposed functions/src/migrations/
 * but the ts-node entry point sits cleaner here.
 */

const admin = require('firebase-admin');

const DRY = !process.argv.includes('--execute');

type SeedEntry = {
  id: string;
  code: string;
  name: string;
};

// Canonical names match src/constants/research.ts so UI lookups continue to
// work during the transition. These three are the only departments that today
// have live user data.
const SEED: SeedEntry[] = [
  { id: 'ece', code: 'ECE', name: 'Electrical and Computer Engineering' },
  {
    id: 'cise',
    code: 'CISE',
    name: 'Computer and Information Sciences and Engineering',
  },
  { id: 'mae', code: 'MAE', name: 'Mechanical and Aerospace Engineering' },
];

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'courseconnect-c6a7b',
    });
  }
  return admin.firestore();
}

async function main() {
  const db = init();
  const col = db.collection('departments');

  console.log(DRY ? '[DRY RUN] Preview:' : '[EXECUTE] Writing:');

  let created = 0;
  let skipped = 0;

  for (const entry of SEED) {
    const ref = col.doc(entry.id);
    const snap = await ref.get();

    if (snap.exists) {
      console.log(`  skip  ${entry.id} (already exists)`);
      skipped += 1;
      continue;
    }

    console.log(
      `  create  ${entry.id}  code=${entry.code}  name="${entry.name}"`
    );
    created += 1;

    if (!DRY) {
      await ref.set({
        id: entry.id,
        code: entry.code,
        name: entry.name,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  console.log('');
  console.log(
    `Summary: ${created} to create, ${skipped} skipped (already existed).`
  );
  if (DRY) {
    console.log('Dry run only — re-run with --execute to apply.');
  } else {
    console.log('Writes applied.');
  }
}

main().catch((err) => {
  console.error('seedDepartments failed:', err);
  process.exit(1);
});
