// Orchestrates a single fetch run: fetch -> persist normalized data ->
// write a run record -> update the parent config's status fields.
//
// All Firestore writes go through batched writes with a hard cap so we
// never exceed the 500-op batch limit.

import * as admin from 'firebase-admin';
import { fetchCoursesForConfig } from './pipeline';
import {
  computeNextRefreshAt,
  toConfigSnapshot,
  type ValidatedConfig,
} from './validation';
import type { FetchResult } from './types';

const BATCH_LIMIT = 450; // leave headroom below the 500-op Firestore limit

function now(): FirebaseFirestore.FieldValue {
  return admin.firestore.FieldValue.serverTimestamp();
}

export interface RunContext {
  db: FirebaseFirestore.Firestore;
  configId: string;
  config: ValidatedConfig;
  triggeredBy: 'manual' | 'scheduled';
  triggeredByUid?: string;
  leaseToken?: string;
}

export interface RunOutcome {
  runId: string;
  status: FetchResult['status'];
  rawCount: number;
  courseCount: number;
  sectionCount: number;
  durationMs: number;
  errors: string[];
  warnings: string[];
}

async function commitCoursesAndSections(
  db: FirebaseFirestore.Firestore,
  configId: string,
  provider: string,
  result: FetchResult
): Promise<void> {
  const catalog = db.collection('catalog');
  const termCode =
    (result.providerMeta &&
      (result.providerMeta as Record<string, unknown>).termCode) ||
    '';
  const prefix = `${provider}:${termCode}`;

  type Op = () => void;
  let batch = db.batch();
  let ops = 0;
  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };
  const add = async (op: Op) => {
    op();
    ops++;
    if (ops >= BATCH_LIMIT) await flush();
  };

  for (const course of result.courses) {
    const id = `${prefix}:${course.code}`;
    const ref = catalog.doc(id);
    const payload = {
      ...course,
      id,
      provider,
      termCode,
      lastUpdated: now(),
      sourceConfigId: configId,
    };
    await add(() => batch.set(ref, payload, { merge: true }));
  }

  for (const section of result.sections) {
    const parentId = `${prefix}:${section.courseCode}`;
    const sectionId = `${prefix}:${section.classNumber}`;
    const ref = catalog.doc(parentId).collection('sections').doc(sectionId);
    const payload = {
      ...section,
      id: sectionId,
      courseId: parentId,
      provider,
      termCode,
      lastUpdated: now(),
      sourceConfigId: configId,
    };
    await add(() => batch.set(ref, payload, { merge: true }));
  }

  await flush();
}

export async function runAndPersist(ctx: RunContext): Promise<RunOutcome> {
  const { db, configId, config, triggeredBy, triggeredByUid } = ctx;
  const runRef = db
    .collection('courseFetchConfigs')
    .doc(configId)
    .collection('runs')
    .doc();
  const runId = runRef.id;
  const startedAt = new Date();

  await runRef.set({
    runId,
    configId,
    startedAt: now(),
    status: 'running',
    rawCount: 0,
    courseCount: 0,
    sectionCount: 0,
    errors: [],
    warnings: [],
    triggeredBy,
    ...(triggeredByUid ? { triggeredByUid } : {}),
  });

  await db.collection('courseFetchConfigs').doc(configId).set(
    {
      lastRunId: runId,
      lastStatus: 'running',
      lastAttemptAt: now(),
    },
    { merge: true }
  );

  const snapshot = toConfigSnapshot(configId, config);
  let result: FetchResult;
  try {
    result = await fetchCoursesForConfig(snapshot);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    await runRef.set(
      {
        finishedAt: now(),
        status: 'failed',
        errors: [message],
        durationMs,
      },
      { merge: true }
    );
    await db
      .collection('courseFetchConfigs')
      .doc(configId)
      .set(
        {
          lastStatus: 'failed',
          lastError: message,
          nextRefreshAt: computeNextRefreshAt(config.refresh, finishedAt),
        },
        { merge: true }
      );
    return {
      runId,
      status: 'failed',
      rawCount: 0,
      courseCount: 0,
      sectionCount: 0,
      durationMs,
      errors: [message],
      warnings: [],
    };
  }

  try {
    await commitCoursesAndSections(db, configId, config.provider, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.status = result.status === 'failed' ? 'failed' : 'partial_success';
    result.errors.push(`persist: ${message}`);
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  await runRef.set(
    {
      finishedAt: now(),
      status: result.status,
      rawCount: result.rawCount,
      courseCount: result.courses.length,
      sectionCount: result.sections.length,
      errors: result.errors.slice(0, 50),
      warnings: result.warnings.slice(0, 50),
      durationMs,
    },
    { merge: true }
  );

  await db
    .collection('courseFetchConfigs')
    .doc(configId)
    .set(
      {
        lastStatus: result.status,
        lastError: result.errors[0] ?? admin.firestore.FieldValue.delete(),
        lastSuccessAt: result.status === 'failed' ? undefined : now(),
        nextRefreshAt: computeNextRefreshAt(config.refresh, finishedAt),
      },
      { merge: true }
    );

  return {
    runId,
    status: result.status,
    rawCount: result.rawCount,
    courseCount: result.courses.length,
    sectionCount: result.sections.length,
    durationMs,
    errors: result.errors,
    warnings: result.warnings,
  };
}
