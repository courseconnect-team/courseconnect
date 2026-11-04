// Persist step of a fetch run: writes the fetched courses and sections to
// the catalog and the live semester layout.

import { createDirectoryLookup } from './directory';
import { createBatchWriter, now } from './firestoreBatch';
import { groupSectionsByCourseInstructor } from './instructors';
import { cleanUpStalePlaceholders } from './placeholderCleanup';
import { applyResolvedEmails, resolveProfessorEmails } from './professorEmails';
import type { SemesterCourseEntry } from './runTypes';
import {
  buildSemesterCourseDoc,
  semesterCourseDocId,
  semesterNameFromConfig,
} from './semesterCourseDoc';
import type { ValidatedConfig } from './validation';
import type { CancelCheck, FetchResult } from './types';

// The courses and sections a run actually writes. With an includeCourses
// allowlist (Preview → Apply) that's only the listed codes; otherwise all
// of them.
export function selectCoursesToWrite(
  result: FetchResult,
  includeCourses?: string[]
): Pick<FetchResult, 'courses' | 'sections'> & { curated: boolean } {
  const includeSet =
    includeCourses && includeCourses.length > 0
      ? new Set(includeCourses.map((c) => c.trim().toUpperCase()))
      : null;
  if (!includeSet) {
    return {
      courses: result.courses,
      sections: result.sections,
      curated: false,
    };
  }
  const isIncluded = (code: string) =>
    includeSet.has(code.trim().toUpperCase());
  return {
    courses: result.courses.filter((c) => isIncluded(c.code)),
    sections: result.sections.filter((s) => isIncluded(s.courseCode)),
    curated: true,
  };
}

export async function commitCoursesAndSections(
  db: FirebaseFirestore.Firestore,
  configId: string,
  provider: string,
  config: ValidatedConfig,
  result: FetchResult,
  includeCourses?: string[],
  checkCancel?: CancelCheck
): Promise<{ cancelled: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  const catalog = db.collection('catalog');
  const termCode =
    (result.providerMeta &&
      (result.providerMeta as Record<string, unknown>).termCode) ||
    '';
  const prefix = `${provider}:${termCode}`;

  const { courses: coursesToWrite, sections: sectionsToWrite } =
    selectCoursesToWrite(result, includeCourses);
  const sectionsByCourseInstructor =
    groupSectionsByCourseInstructor(sectionsToWrite);

  const semesterName = semesterNameFromConfig(config.term, config.year);
  const semesterRef = db.collection('semesters').doc(semesterName);
  const semesterCourses = semesterRef.collection('courses');

  const semesterEntries: SemesterCourseEntry[] = coursesToWrite.flatMap(
    (course) =>
      [...(sectionsByCourseInstructor.get(course.code) ?? new Map())].map(
        ([instructorKey, sections]) => ({
          ref: semesterCourses.doc(
            semesterCourseDocId(course.code, instructorKey)
          ),
          instructorKey,
          sections,
        })
      )
  );
  const { emails: resolvedEmails, existingIds } = await resolveProfessorEmails(
    db,
    semesterEntries,
    createDirectoryLookup(),
    warnings
  );

  const writer = createBatchWriter(db, checkCancel);

  // Ensure the semester doc exists so the admin UI's semester list includes
  // it even on a fresh term. `merge: true` preserves `hidden` if already set.
  await writer.add((batch) =>
    batch.set(
      semesterRef,
      { semester: semesterName, hidden: false },
      { merge: true }
    )
  );

  for (const course of coursesToWrite) {
    if (writer.cancelled) break;
    // 1) Cross-term catalog doc — audit/reuse across configs.
    const catalogId = `${prefix}:${course.code}`;
    const catalogRef = catalog.doc(catalogId);
    await writer.add((batch) =>
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

    // 2) Live semester-course docs — one per (course, professor). Multiple
    // sections taught by the same prof get merged into a single doc so the
    // catalog isn't fragmented per section. Matches the Excel upload doc-id
    // format (`${code} : ${instructor}`) so re-runs and re-uploads converge
    // on the same row.
    const byInstructor =
      sectionsByCourseInstructor.get(course.code) ?? new Map();
    for (const [instructorKey, sections] of byInstructor) {
      const semDocId = semesterCourseDocId(course.code, instructorKey);
      const semRef = semesterCourses.doc(semDocId);
      const semPayload = buildSemesterCourseDoc(
        course,
        sections,
        semesterName,
        configId,
        provider
      );
      applyResolvedEmails(
        semPayload,
        resolvedEmails.get(semDocId),
        existingIds.has(semDocId)
      );
      await writer.add((batch) =>
        batch.set(semRef, semPayload, { merge: true })
      );
    }
  }

  // Also write per-section catalog rows (pure audit, independent of the
  // legacy semester layout).
  for (const section of sectionsToWrite) {
    if (writer.cancelled) break;
    const parentId = `${prefix}:${section.courseCode}`;
    const sectionId = `${prefix}:${section.classNumber}`;
    const ref = catalog.doc(parentId).collection('sections').doc(sectionId);
    await writer.add((batch) =>
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

  // Flush the main writes first so any same-doc cleanup updates see the new
  // state; also keeps the placeholder reads consistent.
  await writer.flush();
  await cleanUpStalePlaceholders(
    semesterCourses,
    sectionsByCourseInstructor,
    writer
  );

  await writer.flush();
  return { cancelled: writer.cancelled, warnings };
}
