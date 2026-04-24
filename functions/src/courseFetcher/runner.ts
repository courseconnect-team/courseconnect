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
import type {
  FetchResult,
  NormalizedCourse,
  NormalizedMeetingTime,
  NormalizedSection,
} from './types';

const BATCH_LIMIT = 450; // leave headroom below the 500-op Firestore limit

// Map a config's (term, year) to the semester doc name the app uses
// everywhere else. The existing collection is `semesters/{name}/courses/*`
// with names like 'Spring 2026' / 'Fall 2026', so we match that casing.
function semesterNameFromConfig(
  term: ValidatedConfig['term'],
  year: number
): string {
  const cap = term.charAt(0).toUpperCase() + term.slice(1);
  return `${cap} ${year}`;
}

function formatTimeRange(
  start: string | undefined,
  end: string | undefined,
  raw: string | undefined
): string {
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return raw ?? '';
}

function toLegacyMeetingTimes(times: NormalizedMeetingTime[]): Array<{
  day: string;
  time: string;
  location: string;
}> {
  if (!Array.isArray(times) || times.length === 0) return [];
  return times.map((m) => ({
    day: (m.day ?? '').trim(),
    time: formatTimeRange(m.startTime, m.endTime, m.rawTime),
    location: (m.location ?? '').trim(),
  }));
}

// Build a doc matching the existing semester-course schema used by the
// Excel upload flow. The `source` + `sourceConfigId` fields let the UI
// distinguish auto-fetched rows from manually uploaded ones.
function buildSemesterCourseDoc(
  course: NormalizedCourse,
  section: NormalizedSection,
  semesterName: string,
  configId: string,
  provider: string
): Record<string, unknown> {
  const instructorNames = section.instructors
    .map((i) => i.name)
    .filter(Boolean);
  const instructorEmails = section.instructors
    .map((i) => i.email)
    .filter((e): e is string => Boolean(e));

  return {
    class_number: section.classNumber,
    code: course.code,
    title: course.title,
    credits: course.credits ?? '',
    department: (course.department ?? '').toUpperCase(),
    department_name: course.departmentName ?? '',
    professor_names: instructorNames.join(', '),
    professor_emails: instructorEmails,
    enrollment_cap:
      section.enrollmentCap != null ? String(section.enrollmentCap) : '',
    enrolled: section.enrolled != null ? String(section.enrolled) : '',
    title_section: section.sectionNumber ?? '',
    semester: semesterName,
    meeting_times: toLegacyMeetingTimes(section.meetingTimes),
    source: 'auto-fetch',
    sourceConfigId: configId,
    sourceProvider: provider,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };
}

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
  // When provided, only courses whose code (uppercased) is in this set are
  // persisted. Used by the Preview → Apply flow so admins can curate the
  // write set without widening the config's filters.
  includeCourses?: string[];
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
  config: ValidatedConfig,
  result: FetchResult,
  includeCourses?: string[]
): Promise<void> {
  const catalog = db.collection('catalog');
  const termCode =
    (result.providerMeta &&
      (result.providerMeta as Record<string, unknown>).termCode) ||
    '';
  const prefix = `${provider}:${termCode}`;

  const includeSet =
    includeCourses && includeCourses.length > 0
      ? new Set(includeCourses.map((c) => c.trim().toUpperCase()))
      : null;
  const isIncluded = (code: string) =>
    includeSet === null || includeSet.has(code.trim().toUpperCase());

  const coursesToWrite = includeSet
    ? result.courses.filter((c) => isIncluded(c.code))
    : result.courses;
  const sectionsToWrite = includeSet
    ? result.sections.filter((s) => isIncluded(s.courseCode))
    : result.sections;

  // Index sections by courseCode so we can emit one legacy semester-course
  // doc per (course, section) pair below.
  const sectionsByCourse = new Map<string, NormalizedSection[]>();
  for (const section of sectionsToWrite) {
    const key = section.courseCode;
    const bucket = sectionsByCourse.get(key);
    if (bucket) bucket.push(section);
    else sectionsByCourse.set(key, [section]);
  }

  const semesterName = semesterNameFromConfig(config.term, config.year);
  const semesterRef = db.collection('semesters').doc(semesterName);
  const semesterCourses = semesterRef.collection('courses');

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

  // Ensure the semester doc exists so the admin UI's semester list includes
  // it even on a fresh term. `merge: true` preserves `hidden` if already set.
  await add(() =>
    batch.set(
      semesterRef,
      { semester: semesterName, hidden: false },
      { merge: true }
    )
  );

  for (const course of coursesToWrite) {
    // 1) Cross-term catalog doc — audit/reuse across configs.
    const catalogId = `${prefix}:${course.code}`;
    const catalogRef = catalog.doc(catalogId);
    await add(() =>
      batch.set(
        catalogRef,
        {
          ...course,
          id: catalogId,
          provider,
          termCode,
          lastUpdated: now(),
          sourceConfigId: configId,
        },
        { merge: true }
      )
    );

    // 2) Live semester-course docs — one per section, matching the existing
    // schema the app already reads. Doc id uses `__` to avoid colliding
    // with Excel rows which use `${code} : ${instructor}`.
    const sections = sectionsByCourse.get(course.code) ?? [];
    for (const section of sections) {
      const semDocId = `${course.code}__${section.classNumber}`;
      const semRef = semesterCourses.doc(semDocId);
      const semPayload = buildSemesterCourseDoc(
        course,
        section,
        semesterName,
        configId,
        provider
      );
      await add(() => batch.set(semRef, semPayload, { merge: true }));
    }
  }

  // Also write per-section catalog rows (pure audit, independent of the
  // legacy semester layout).
  for (const section of sectionsToWrite) {
    const parentId = `${prefix}:${section.courseCode}`;
    const sectionId = `${prefix}:${section.classNumber}`;
    const ref = catalog.doc(parentId).collection('sections').doc(sectionId);
    await add(() =>
      batch.set(
        ref,
        {
          ...section,
          id: sectionId,
          courseId: parentId,
          provider,
          termCode,
          lastUpdated: now(),
          sourceConfigId: configId,
        },
        { merge: true }
      )
    );
  }

  await flush();
}

export async function runAndPersist(ctx: RunContext): Promise<RunOutcome> {
  const { db, configId, config, triggeredBy, triggeredByUid, includeCourses } =
    ctx;
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
    await commitCoursesAndSections(
      db,
      configId,
      config.provider,
      config,
      result,
      includeCourses
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.status = result.status === 'failed' ? 'failed' : 'partial_success';
    result.errors.push(`persist: ${message}`);
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  // Report counts of what was actually persisted — when the caller curated a
  // subset via includeCourses, the fetched totals overstate the write.
  const includeSet =
    includeCourses && includeCourses.length > 0
      ? new Set(includeCourses.map((c) => c.trim().toUpperCase()))
      : null;
  const persistedCourseCount = includeSet
    ? result.courses.filter((c) => includeSet.has(c.code.trim().toUpperCase()))
        .length
    : result.courses.length;
  const persistedSectionCount = includeSet
    ? result.sections.filter((s) =>
        includeSet.has(s.courseCode.trim().toUpperCase())
      ).length
    : result.sections.length;

  await runRef.set(
    {
      finishedAt: now(),
      status: result.status,
      rawCount: result.rawCount,
      courseCount: persistedCourseCount,
      sectionCount: persistedSectionCount,
      errors: result.errors.slice(0, 50),
      warnings: result.warnings.slice(0, 50),
      durationMs,
      ...(includeSet ? { curated: true } : {}),
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
    courseCount: persistedCourseCount,
    sectionCount: persistedSectionCount,
    durationMs,
    errors: result.errors,
    warnings: result.warnings,
  };
}
