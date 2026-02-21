/**
 * Cleanup script to remove nested application sub-collections
 *
 * This removes the nested structure created by the previous migration:
 * applications/{userId}/course_assistant/{id}
 * applications/{userId}/supervised_teaching/{id}
 *
 * Usage:
 *   npm run cleanup:nested-apps           // Dry run
 *   npm run cleanup:nested-apps --execute // Actually delete
 */

const admin = require('firebase-admin');

const DRY = !process.argv.includes('--execute');
const BATCH_SIZE = 400;

type ApplicationType = 'course_assistant' | 'supervised_teaching';

interface CleanupStats {
  userDocs: number;
  courseAssistantDocs: number;
  supervisedTeachingDocs: number;
  deleted: number;
}

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  return admin.firestore();
}

/**
 * Delete all documents in a sub-collection
 */
async function deleteSubCollection(
  db: any,
  userId: string,
  subCollection: ApplicationType,
  stats: CleanupStats
): Promise<void> {
  const subColRef = db
    .collection('applications')
    .doc(userId)
    .collection(subCollection);

  const snapshot = await subColRef.get();

  if (snapshot.empty) {
    return;
  }

  console.log(`  Found ${snapshot.size} docs in applications/${userId}/${subCollection}`);

  if (subCollection === 'course_assistant') {
    stats.courseAssistantDocs += snapshot.size;
  } else {
    stats.supervisedTeachingDocs += snapshot.size;
  }

  if (!DRY) {
    // Delete in batches
    const batch = db.batch();
    snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    stats.deleted += snapshot.size;
    console.log(`  ✓ Deleted ${snapshot.size} docs from ${subCollection}`);
  } else {
    console.log(`  [DRY] Would delete ${snapshot.size} docs from ${subCollection}`);
  }
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('='.repeat(60));
  console.log('Nested Application Cleanup Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY ? 'DRY RUN (no changes will be made)' : 'EXECUTE'}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log('='.repeat(60));
  console.log('');

  const db = init();
  const applicationsCol = db.collection('applications');

  const stats: CleanupStats = {
    userDocs: 0,
    courseAssistantDocs: 0,
    supervisedTeachingDocs: 0,
    deleted: 0,
  };

  let lastId: string | null = null;
  let done = false;

  while (!done) {
    let q = applicationsCol
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(BATCH_SIZE);

    if (lastId) {
      q = q.startAfter(lastId);
    }

    const snap = await q.get();

    if (snap.empty) {
      break;
    }

    console.log(`Processing batch of ${snap.size} user documents...`);

    for (const doc of snap.docs) {
      stats.userDocs++;
      const userId = doc.id;

      console.log(`Checking ${userId}...`);

      // Delete both sub-collections
      await deleteSubCollection(db, userId, 'course_assistant', stats);
      await deleteSubCollection(db, userId, 'supervised_teaching', stats);
    }

    lastId = snap.docs[snap.docs.length - 1].id;
    if (snap.size < BATCH_SIZE) {
      done = true;
    }

    console.log(''); // Empty line between batches
  }

  // Print summary
  console.log('='.repeat(60));
  console.log('Cleanup Summary');
  console.log('='.repeat(60));
  console.log(`User documents scanned: ${stats.userDocs}`);
  console.log(`Course assistant docs found: ${stats.courseAssistantDocs}`);
  console.log(`Supervised teaching docs found: ${stats.supervisedTeachingDocs}`);
  console.log(`Total nested docs: ${stats.courseAssistantDocs + stats.supervisedTeachingDocs}`);
  if (!DRY) {
    console.log(`Deleted: ${stats.deleted}`);
  }
  console.log('='.repeat(60));

  if (DRY) {
    console.log('');
    console.log('This was a DRY RUN - no changes were made.');
    console.log('Run with --execute flag to perform actual cleanup.');
  } else {
    console.log('');
    console.log('Cleanup complete!');
  }
}

// Run cleanup
cleanup().catch((error) => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
