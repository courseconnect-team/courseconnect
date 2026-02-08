/**
 * Migration script to move applications from flat structure to sub-collection structure
 *
 * Old structure: applications/{userId} - all fields in one document
 * New structure: applications/{userId}/types/{applicationType} - parent + sub-collections
 *
 * Usage:
 *   npm run migrate:applications           // Dry run (shows what would be migrated)
 *   npm run migrate:applications --execute // Actually perform migration
 *   npm run migrate:applications --execute --delete-old // Migrate and delete old data
 *   npm run migrate:applications --execute --overwrite  // Overwrite existing sub-collection docs
 */

import * as admin from 'firebase-admin';

const DRY = !process.argv.includes('--execute');
const DELETE_OLD = process.argv.includes('--delete-old');
const OVERWRITE = process.argv.includes('--overwrite');
const BATCH_SIZE = 400;

type AnyMap = Record<string, any>;
type ApplicationType = 'course_assistant' | 'supervised_teaching';

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  existed: number;
  deleted: number;
  errors: number;
}

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  return admin.firestore();
}

/**
 * Infer application type from document data
 */
function inferApplicationType(data: AnyMap): ApplicationType {
  // If application_type field exists, use it
  if (data.application_type) {
    return data.application_type as ApplicationType;
  }

  // Infer based on schema:
  // - course_assistant has 'courses' object field
  // - supervised_teaching has 'phdAdvisor' field
  if (data.courses && typeof data.courses === 'object') {
    return 'course_assistant';
  }

  if (data.phdAdvisor) {
    return 'supervised_teaching';
  }

  // Default to course_assistant if can't determine
  console.warn(
    `Could not infer type for document, defaulting to course_assistant`
  );
  return 'course_assistant';
}

// No longer need parent document fields - each application is independent

/**
 * Migrate a single application document
 */
async function migrateApplication(
  db: admin.firestore.Firestore,
  userId: string,
  data: AnyMap,
  stats: MigrationStats
): Promise<void> {
  try {
    const applicationType = inferApplicationType(data);

    // Check if already migrated by querying the sub-collection
    if (!OVERWRITE && !DRY) {
      const existingApps = await db
        .collection('applications')
        .doc(userId)
        .collection(applicationType)
        .where('date', '==', data.date) // Check if same application date exists
        .limit(1)
        .get();

      if (!existingApps.empty) {
        stats.existed++;
        console.log(
          `  [EXISTS] ${userId} - ${applicationType} (date: ${data.date}) already migrated`
        );
        return;
      }
    }

    // Prepare application data with timestamps
    const applicationData = {
      ...data,
      application_type: applicationType,
      created_at:
        data.created_at || admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (DRY) {
      console.log(`  [DRY] Would migrate: ${userId} as ${applicationType}`);
      console.log(
        `    - Path: applications/${userId}/${applicationType}/{auto-id}`
      );
      console.log(`    - Date: ${data.date}`);
      stats.migrated++;
    } else {
      // Write to new sub-collection structure with auto-generated ID
      const newAppRef = await db
        .collection('applications')
        .doc(userId)
        .collection(applicationType)
        .add(applicationData);

      stats.migrated++;
      console.log(
        `  [MIGRATED] ${userId} - ${applicationType} (ID: ${newAppRef.id})`
      );

      // Optionally delete old flat document if requested
      if (DELETE_OLD) {
        await db.collection('applications').doc(userId).delete();
        stats.deleted++;
      }
    }
  } catch (error: any) {
    stats.errors++;
    console.error(`  [ERROR] Failed to migrate ${userId}:`, error.message);
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('='.repeat(60));
  console.log('Application Migration Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY ? 'DRY RUN (no changes will be made)' : 'EXECUTE'}`);
  console.log(`Delete old data: ${DELETE_OLD ? 'YES' : 'NO'}`);
  console.log(`Overwrite existing: ${OVERWRITE ? 'YES' : 'NO'}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log('='.repeat(60));
  console.log('');

  const db = init();
  const srcCol = db.collection('applications');

  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    existed: 0,
    deleted: 0,
    errors: 0,
  };

  let lastId: string | null = null;
  let done = false;

  while (!done) {
    let q = srcCol
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(BATCH_SIZE);

    if (lastId) {
      q = q.startAfter(lastId);
    }

    const snap = await q.get();

    if (snap.empty) {
      break;
    }

    console.log(`Processing batch of ${snap.size} documents...`);

    for (const doc of snap.docs) {
      stats.total++;
      const data = doc.data() as AnyMap;
      const userId = doc.id;

      // Skip if document is missing essential fields
      if (!data.firstname || !data.email || !data.ufid) {
        stats.skipped++;
        console.warn(`  [SKIP] ${userId} - missing essential fields`);
        continue;
      }

      // Skip if document appears to be a new structure marker (no actual application data)
      if (!data.date && !data.status) {
        stats.skipped++;
        console.warn(
          `  [SKIP] ${userId} - appears to be metadata doc, not an application`
        );
        continue;
      }

      await migrateApplication(db, userId, data, stats);
    }

    lastId = snap.docs[snap.docs.length - 1].id;
    if (snap.size < BATCH_SIZE) {
      done = true;
    }

    console.log(''); // Empty line between batches
  }

  // Print summary
  console.log('='.repeat(60));
  console.log('Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total documents processed: ${stats.total}`);
  console.log(`Successfully migrated: ${stats.migrated}`);
  console.log(`Already existed: ${stats.existed}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  if (DELETE_OLD) {
    console.log(`Deleted old documents: ${stats.deleted}`);
  }
  console.log('='.repeat(60));

  if (DRY) {
    console.log('');
    console.log('This was a DRY RUN - no changes were made.');
    console.log('Run with --execute flag to perform actual migration.');
  } else {
    console.log('');
    console.log('Migration complete!');
    if (!DELETE_OLD) {
      console.log(
        'Old data has been preserved. Run with --delete-old to remove it.'
      );
    }
  }
}

// Run migration
migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
