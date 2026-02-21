/**
 * Migration script for applications schema.
 *
 * Target schema:
 * applications/{applicationType}/uid/{uid}
 *
 * Supported sources:
 * 1) Legacy: applications/{uid}
 * 2) Flat: course_assistant/{docId} with uid field
 * 3) Flat: supervised_teaching/{docId} with uid field
 *
 * Usage:
 *   npm run migrate:applications:dry
 *   npm run migrate:applications -- --execute
 *   npm run migrate:applications -- --execute --delete-old
 *   npm run migrate:applications -- --execute --overwrite
 */

const admin = require('firebase-admin');

const DRY = !process.argv.includes('--execute');
const DELETE_OLD = process.argv.includes('--delete-old');
const OVERWRITE = process.argv.includes('--overwrite');

type AnyMap = Record<string, any>;
type ApplicationType = 'course_assistant' | 'supervised_teaching';
type SourceType = 'legacy' | 'course_assistant' | 'supervised_teaching';

interface MigrationStats {
  scanned: number;
  migrated: number;
  skipped: number;
  existed: number;
  deleted: number;
  errors: number;
}

interface SourceRecord {
  source: SourceType;
  docPath: string;
  docId: string;
  data: AnyMap;
}

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  return admin.firestore();
}

function inferApplicationType(data: AnyMap): ApplicationType {
  if (data.application_type === 'supervised_teaching') {
    return 'supervised_teaching';
  }
  if (data.application_type === 'course_assistant') {
    return 'course_assistant';
  }
  if (data.phdAdvisor || data.registerTerm || data.coursesComfortable) {
    return 'supervised_teaching';
  }
  return 'course_assistant';
}

function isLikelyApplicationDoc(data: AnyMap): boolean {
  return Boolean(
    data &&
      (data.email ||
        data.uid ||
        data.firstname ||
        data.lastname ||
        data.date ||
        data.status ||
        data.courses)
  );
}

function resolveUserId(record: SourceRecord): string | null {
  if (typeof record.data.uid === 'string' && record.data.uid.trim()) {
    return record.data.uid.trim();
  }
  if (record.source === 'legacy') {
    return record.docId;
  }
  return null;
}

async function migrateRecord(
  db: any,
  record: SourceRecord,
  stats: MigrationStats
): Promise<void> {
  try {
    const userId = resolveUserId(record);
    if (!userId) {
      stats.skipped++;
      console.warn(`[SKIP] ${record.docPath} - missing uid`);
      return;
    }

    const appType =
      record.source === 'course_assistant'
        ? 'course_assistant'
        : record.source === 'supervised_teaching'
        ? 'supervised_teaching'
        : inferApplicationType(record.data);

    const targetRef = db
      .collection('applications')
      .doc(appType)
      .collection('uid')
      .doc(userId);

    if (!DRY) {
      const existing = await targetRef.get();
      if (existing.exists && !OVERWRITE) {
        stats.existed++;
        console.log(`[EXISTS] applications/${appType}/uid/${userId}`);
        return;
      }
    }

    const payload = {
      ...record.data,
      uid: userId,
      application_type: appType,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      created_at:
        record.data.created_at || admin.firestore.FieldValue.serverTimestamp(),
    };

    if (DRY) {
      console.log(`[DRY] ${record.docPath} -> applications/${appType}/uid/${userId}`);
      stats.migrated++;
      return;
    }

    await targetRef.set(payload, { merge: true });
    stats.migrated++;
    console.log(`[MIGRATED] ${record.docPath} -> applications/${appType}/uid/${userId}`);

    if (DELETE_OLD) {
      await db.doc(record.docPath).delete();
      stats.deleted++;
    }
  } catch (error: any) {
    stats.errors++;
    console.error(`[ERROR] ${record.docPath}:`, error.message);
  }
}

async function collectSourceRecords(db: any): Promise<SourceRecord[]> {
  const records: SourceRecord[] = [];

  const legacySnap = await db.collection('applications').get();
  legacySnap.docs.forEach((doc: any) => {
    const data = doc.data() as AnyMap;
    // Skip container docs in already-migrated schema
    if (doc.id === 'course_assistant' || doc.id === 'supervised_teaching') {
      return;
    }
    if (!isLikelyApplicationDoc(data)) return;
    records.push({
      source: 'legacy',
      docPath: `applications/${doc.id}`,
      docId: doc.id,
      data,
    });
  });

  const courseAssistantSnap = await db.collection('course_assistant').get();
  courseAssistantSnap.docs.forEach((doc: any) => {
    const data = doc.data() as AnyMap;
    if (!isLikelyApplicationDoc(data)) return;
    records.push({
      source: 'course_assistant',
      docPath: `course_assistant/${doc.id}`,
      docId: doc.id,
      data,
    });
  });

  const supervisedSnap = await db.collection('supervised_teaching').get();
  supervisedSnap.docs.forEach((doc: any) => {
    const data = doc.data() as AnyMap;
    if (!isLikelyApplicationDoc(data)) return;
    records.push({
      source: 'supervised_teaching',
      docPath: `supervised_teaching/${doc.id}`,
      docId: doc.id,
      data,
    });
  });

  return records;
}

async function migrate() {
  console.log('='.repeat(70));
  console.log('Application Migration Script');
  console.log('='.repeat(70));
  console.log(`Mode: ${DRY ? 'DRY RUN' : 'EXECUTE'}`);
  console.log(`Delete old data: ${DELETE_OLD ? 'YES' : 'NO'}`);
  console.log(`Overwrite existing: ${OVERWRITE ? 'YES' : 'NO'}`);
  console.log('Target: applications/{applicationType}/uid/{uid}');
  console.log('='.repeat(70));
  console.log('');

  const db = init();
  const records = await collectSourceRecords(db);

  const stats: MigrationStats = {
    scanned: records.length,
    migrated: 0,
    skipped: 0,
    existed: 0,
    deleted: 0,
    errors: 0,
  };

  for (const record of records) {
    await migrateRecord(db, record, stats);
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('Migration Summary');
  console.log('='.repeat(70));
  console.log(`Scanned: ${stats.scanned}`);
  console.log(`Migrated: ${stats.migrated}`);
  console.log(`Already existed: ${stats.existed}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  if (DELETE_OLD) {
    console.log(`Deleted old docs: ${stats.deleted}`);
  }
  console.log('='.repeat(70));
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
