/**
 * Bootstrap the first super admin for Course Connect.
 *
 * This is the one-time admin-SDK path documented in Unit 3 of the multi-dept
 * plan. After the first super admin exists, further promotions go through the
 * `promoteSuperAdmin` Cloud Function (which is gated by the existing super
 * admin). This script is NOT a web-callable endpoint — it must run locally
 * with service-account credentials.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     npx ts-node src/scripts/bootstrapSuperAdmin.ts --email=you@ufl.edu
 *
 *   Add --execute to actually write; without it, dry-run only.
 */

const admin = require('firebase-admin');

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((v) => v.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

const EMAIL = getArg('email');
const DRY = !process.argv.includes('--execute');

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'courseconnect-c6a7b',
    });
  }
  return { db: admin.firestore(), auth: admin.auth() };
}

async function main() {
  if (!EMAIL) {
    console.error('Missing --email=<user@ufl.edu>');
    process.exit(2);
  }

  const { db, auth } = init();

  let user;
  try {
    user = await auth.getUserByEmail(EMAIL);
  } catch (err) {
    console.error(
      `No Firebase Auth user found for ${EMAIL}. Sign in once via the app before running this.`
    );
    process.exit(3);
  }

  console.log(
    `${
      DRY ? '[DRY RUN]' : '[EXECUTE]'
    } Bootstrap super admin for ${EMAIL} (uid=${user.uid})`
  );

  if (DRY) {
    console.log('Dry run only — re-run with --execute to apply.');
    return;
  }

  await db.collection('users').doc(user.uid).set(
    {
      superAdmin: true,
      superAdminAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`✓ users/${user.uid}.superAdmin = true`);
}

main().catch((err) => {
  console.error('bootstrapSuperAdmin failed:', err);
  process.exit(1);
});
