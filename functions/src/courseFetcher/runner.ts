// Orchestrates a single fetch run: fetch -> persist normalized data ->
// write a run record -> update the parent config's status fields.
//
// The persist step itself lives in ./persist.

import * as admin from 'firebase-admin';
import { fetchCoursesForConfig } from './pipeline';
import { computeNextRefreshAt, toConfigSnapshot } from './validation';
import type { CancelCheck, FetchResult } from './types';
import type { RunContext, RunOutcome } from './runTypes';
import { now } from './firestoreBatch';
import { commitCoursesAndSections, selectCoursesToWrite } from './persist';

export type { RunContext, RunOutcome } from './runTypes';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// Cooperative cancellation probe. Reads the run doc; returns true once an
// admin has hit Cancel via cancelCourseFetchRun. One extra read per page /
// batch is cheap at UF scale.
function createCancelCheck(
  runRef: FirebaseFirestore.DocumentReference
): CancelCheck {
  return async () => {
    try {
      const snap = await runRef.get();
      return snap.exists && snap.data()?.cancelRequested === true;
    } catch {
      return false;
    }
  };
}

// Pull the cancelling uid off the run doc (if any) so the warning message
// names the admin who hit Cancel. Best-effort only.
async function cancelRequestedBy(
  runRef: FirebaseFirestore.DocumentReference
): Promise<string | undefined> {
  try {
    const snap = await runRef.get();
    const data = snap.data();
    if (typeof data?.cancelRequestedBy === 'string') {
      return data.cancelRequestedBy;
    }
  } catch {
    // ignore
  }
  return undefined;
}

// The fetch itself threw: mark the run and config failed and stop.
async function recordFetchFailure(
  runRef: FirebaseFirestore.DocumentReference,
  configRef: FirebaseFirestore.DocumentReference,
  config: RunContext['config'],
  startedAt: Date,
  err: unknown
): Promise<RunOutcome> {
  const message = errorMessage(err);
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
  await configRef.set(
    {
      lastStatus: 'failed',
      lastError: message,
      nextRefreshAt: computeNextRefreshAt(config.refresh, finishedAt),
    },
    { merge: true }
  );
  return {
    runId: runRef.id,
    status: 'failed',
    rawCount: 0,
    courseCount: 0,
    sectionCount: 0,
    durationMs,
    errors: [message],
    warnings: [],
  };
}

export async function runAndPersist(ctx: RunContext): Promise<RunOutcome> {
  const { db, configId, config, triggeredBy, triggeredByUid, includeCourses } =
    ctx;
  const configRef = db.collection('courseFetchConfigs').doc(configId);
  const runRef = configRef.collection('runs').doc();
  const runId = runRef.id;
  const startedAt = new Date();

  await runRef.set({
    runId,
    configId,
    startedAt: now(),
    status: 'running',
    phase: 'fetching',
    rawCount: 0,
    courseCount: 0,
    sectionCount: 0,
    errors: [],
    warnings: [],
    cancelRequested: false,
    triggeredBy,
    ...(triggeredByUid ? { triggeredByUid } : {}),
  });

  await configRef.set(
    {
      lastRunId: runId,
      lastStatus: 'running',
      lastAttemptAt: now(),
    },
    { merge: true }
  );

  const checkCancel = createCancelCheck(runRef);

  const snapshot = toConfigSnapshot(configId, config);
  let result: FetchResult;
  try {
    result = await fetchCoursesForConfig(snapshot, { checkCancel });
  } catch (err) {
    return recordFetchFailure(runRef, configRef, config, startedAt, err);
  }

  // If the provider loop was cancelled, skip persist entirely. No partial
  // writes, no lastSuccessAt bump; nextRefreshAt still advances so a cron
  // doesn't retry-storm on the next tick.
  let persistCancelled = false;
  if (result.status === 'cancelled' || result.cancelled) {
    // fall through to terminal block
  } else {
    await runRef.set({ phase: 'writing' }, { merge: true });
    try {
      const commitRes = await commitCoursesAndSections(
        db,
        configId,
        config.provider,
        config,
        result,
        includeCourses,
        checkCancel
      );
      persistCancelled = commitRes.cancelled;
      result.warnings.push(...commitRes.warnings);
    } catch (err) {
      result.status = result.status === 'failed' ? 'failed' : 'partial_success';
      result.errors.push(`persist: ${errorMessage(err)}`);
    }
  }

  const cancelled = result.status === 'cancelled' || persistCancelled;
  if (cancelled) {
    result.status = 'cancelled';
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  // Report counts of what was actually persisted — when the caller curated a
  // subset via includeCourses, the fetched totals overstate the write.
  const persisted = selectCoursesToWrite(result, includeCourses);
  const persistedCourseCount = persisted.courses.length;
  const persistedSectionCount = persisted.sections.length;

  if (cancelled) {
    const cancelWho = await cancelRequestedBy(runRef);
    const phase = persistCancelled ? 'writing' : 'fetching';
    result.warnings.unshift(
      `run cancelled${cancelWho ? ` by ${cancelWho}` : ''} during ${phase}`
    );
  }

  await runRef.set(
    {
      finishedAt: now(),
      status: result.status,
      rawCount: result.rawCount,
      courseCount: cancelled && !persistCancelled ? 0 : persistedCourseCount,
      sectionCount: cancelled && !persistCancelled ? 0 : persistedSectionCount,
      errors: result.errors.slice(0, 50),
      warnings: result.warnings.slice(0, 50),
      durationMs,
      ...(persisted.curated ? { curated: true } : {}),
    },
    { merge: true }
  );

  await configRef.set(
    {
      lastStatus: result.status,
      lastError:
        cancelled || !result.errors[0]
          ? admin.firestore.FieldValue.delete()
          : result.errors[0],
      lastSuccessAt:
        result.status === 'failed' || cancelled ? undefined : now(),
      nextRefreshAt: computeNextRefreshAt(config.refresh, finishedAt),
    },
    { merge: true }
  );

  return {
    runId,
    status: result.status,
    rawCount: result.rawCount,
    courseCount: cancelled && !persistCancelled ? 0 : persistedCourseCount,
    sectionCount: cancelled && !persistCancelled ? 0 : persistedSectionCount,
    durationMs,
    errors: result.errors,
    warnings: result.warnings,
  };
}
