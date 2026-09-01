/**
 * Reading every faculty approval off a student's application, and pairing each
 * one with the assignment (if any) that admin created from it.
 *
 * An application stores per-course state as `{ [semester]: { [courseId]: status } }`
 * (legacy rows use a flat `${semester}|||${courseId}` key). `courseId` is the
 * course doc id — `${code} : ${instructor}` — so the set of approving
 * instructors is exactly the set of course entries a professor marked
 * 'approved'. Admin assignment then flips one of them to 'accepted' and writes
 * an `assignments` doc whose `class_codes` points back at the same course id.
 *
 * Pairing has to survive real data: course keys are hand-edited (spacing and
 * case drift), the same `(code, instructor)` id repeats across semesters, and
 * an assignment can point at a course no professor approved — admin approval
 * supersedes faculty, so an admin can assign any course the student applied
 * for. Anything currently assigned is therefore always included, approved or
 * not; otherwise the assignment would be invisible and impossible to undo.
 *
 * Pure so the pairing rules can be tested without Firestore.
 */
import { normalizeCourseKey, splitCourseKey } from './courseSupervisor';
import { normalizeSemesters, semesterRank } from './semester';

export interface FlatCourseEntry {
  semester: string;
  courseId: string;
  status: string;
}

/**
 * Walk the canonical nested shape `{ [semester]: { [courseId]: status } }` (and
 * the legacy `${semester}|||${courseId}` flat shape) into a list of
 * per-(semester, course) entries. A list — not a map keyed by courseId —
 * because the same `(code, instructor)` doc id often appears across several
 * semesters, and a map collapse would lose every status but the last.
 */
export function flattenCourseStatuses(courses: unknown): FlatCourseEntry[] {
  if (!courses || typeof courses !== 'object') return [];
  const out: FlatCourseEntry[] = [];
  for (const [key, val] of Object.entries(courses as Record<string, unknown>)) {
    if (val && typeof val === 'object') {
      for (const [courseId, status] of Object.entries(
        val as Record<string, unknown>
      )) {
        if (typeof status === 'string')
          out.push({ semester: key, courseId, status });
      }
    } else if (typeof val === 'string') {
      const sepIdx = key.indexOf('|||');
      if (sepIdx !== -1) {
        out.push({
          semester: key.slice(0, sepIdx),
          courseId: key.slice(sepIdx + 3),
          status: val,
        });
      } else {
        out.push({ semester: '', courseId: key, status: val });
      }
    }
  }
  return out;
}

/** Per-course states that mean a professor signed off on this student. */
const APPROVED_STATUSES = new Set(['approved', 'accepted']);

/** "Fall2026" and "Fall 2026" are the same term to a human; make them equal. */
export function normalizeSemesterName(raw: unknown): string {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/\s+/g, '');
}

/** Identity of one approval row: a course within a specific semester. */
export function approvalKey(semester: string, courseId: string): string {
  return `${semester}|||${courseId}`;
}

/** The fields of an `assignments` doc that the pairing needs. */
export interface AssignmentRef {
  id: string;
  class_codes?: unknown;
  semesters?: unknown;
}

export interface ApprovalEntry {
  /** Stable identity for React keys and radio values. */
  key: string;
  semester: string;
  /** Raw course doc id, e.g. `EEL3111C : Rambo, Keith Jeffrey`. */
  courseId: string;
  /** Course code half of the id, uppercased. */
  code: string;
  /** Instructor half of the id; empty when the id carries no instructor. */
  instructor: string;
  /** Per-course status from the application ('' for an assignment-only row). */
  status: string;
  /** True when a professor approved (or admin already accepted) this course. */
  approved: boolean;
  /** Assignments doc id when the student currently holds this course. */
  assignmentId: string | null;
}

function makeEntry(
  semester: string,
  courseId: string,
  status: string,
  approved: boolean,
  assignmentId: string | null,
  key: string
): ApprovalEntry {
  const { code, instructor } = splitCourseKey(courseId);
  return {
    key,
    semester,
    courseId,
    code,
    instructor,
    status,
    approved,
    assignmentId,
  };
}

/**
 * Every instructor who approved this student, plus whichever course they are
 * currently assigned to.
 *
 * Assignments are matched to approvals in two passes — semester-qualified
 * first, then course key alone — so an assignment whose `semesters` drifted
 * from the application's semester bucket still lands on its course instead of
 * showing up twice. An assignment that matches nothing becomes its own row.
 *
 * Ordering puts the current assignment first (the answer to "who has this
 * student?"), then newest semester, then instructor name.
 */
export function buildApprovalEntries(
  courses: unknown,
  assignments: AssignmentRef[]
): ApprovalEntry[] {
  const flat = flattenCourseStatuses(courses);
  const assignmentByEntry = new Map<string, string>();
  const claimed = new Set<string>();

  const findFor = (
    assignment: AssignmentRef,
    requireSemester: boolean
  ): FlatCourseEntry | undefined => {
    const courseKey = normalizeCourseKey(String(assignment.class_codes ?? ''));
    if (!courseKey) return undefined;
    const semesters = normalizeSemesters(assignment.semesters).map(
      normalizeSemesterName
    );
    return flat.find((e) => {
      if (claimed.has(approvalKey(e.semester, e.courseId))) return false;
      if (normalizeCourseKey(e.courseId) !== courseKey) return false;
      if (!requireSemester) return true;
      if (!semesters.length || !e.semester) return false;
      return semesters.includes(normalizeSemesterName(e.semester));
    });
  };

  let pending = [...assignments];
  for (const requireSemester of [true, false]) {
    const stillPending: AssignmentRef[] = [];
    for (const assignment of pending) {
      const hit = findFor(assignment, requireSemester);
      if (!hit) {
        stillPending.push(assignment);
        continue;
      }
      const key = approvalKey(hit.semester, hit.courseId);
      claimed.add(key);
      assignmentByEntry.set(key, assignment.id);
    }
    pending = stillPending;
  }

  const entries: ApprovalEntry[] = [];
  const usedKeys = new Set<string>();

  for (const e of flat) {
    const key = approvalKey(e.semester, e.courseId);
    const assignmentId = assignmentByEntry.get(key) ?? null;
    const approved = APPROVED_STATUSES.has(e.status.trim().toLowerCase());
    if (!approved && !assignmentId) continue;
    usedKeys.add(key);
    entries.push(
      makeEntry(e.semester, e.courseId, e.status, approved, assignmentId, key)
    );
  }

  // Assignments with no course entry left to land on: keep them visible so the
  // admin can still see — and undo — an assignment the application no longer
  // carries a status for.
  for (const assignment of pending) {
    const courseId = String(assignment.class_codes ?? '').trim();
    if (!courseId) continue;
    const semester = normalizeSemesters(assignment.semesters)[0] ?? '';
    let key = approvalKey(semester, courseId);
    if (usedKeys.has(key)) key = `${key}#${assignment.id}`;
    usedKeys.add(key);
    entries.push(makeEntry(semester, courseId, '', false, assignment.id, key));
  }

  entries.sort((a, b) => {
    if (Boolean(a.assignmentId) !== Boolean(b.assignmentId)) {
      return a.assignmentId ? -1 : 1;
    }
    const ra = semesterRank(a.semester);
    const rb = semesterRank(b.semester);
    if (ra != null && rb != null && ra !== rb) return rb - ra;
    if ((ra == null) !== (rb == null)) return ra == null ? 1 : -1;
    const byInstructor = a.instructor.localeCompare(b.instructor);
    if (byInstructor) return byInstructor;
    return a.code.localeCompare(b.code);
  });

  return entries;
}

/** The entry the student currently holds, if any. */
export function assignedEntry(
  entries: ApprovalEntry[]
): ApprovalEntry | undefined {
  return entries.find((e) => e.assignmentId);
}

/**
 * Course code with the conventional space, e.g. `EEL3111C` → `EEL 3111C`.
 * Mirrors `prettyCourseId`'s code half, kept here so this module stays free of
 * the Firestore-importing hook that owns the display helpers.
 */
export function formatCourseCode(code: string): string {
  const m = String(code ?? '')
    .trim()
    .toUpperCase()
    .match(/^([A-Z]{2,4})(\d{3,4}[A-Z]?)$/);
  return m ? `${m[1]} ${m[2]}` : String(code ?? '').trim();
}

/** Instructor names, in display order, with duplicates collapsed. */
export function approvingInstructors(entries: ApprovalEntry[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of entries) {
    if (!e.approved) continue;
    const name = e.instructor.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

/**
 * Where a course's status actually lives inside an application's `courses` map,
 * as Firestore field-path segments.
 *
 * Written as segments rather than a dotted string because both halves of a
 * course id are free text — an instructor named "Smith, John A." would put a
 * dot inside a segment and silently retarget a dotted path. Callers pass the
 * segments to `firebase.firestore.FieldPath`.
 *
 * Prefers the semester the caller names, then any other bucket holding the same
 * course, then the legacy `${semester}|||${courseId}` and bare-key shapes.
 * Falls back to the canonical nested path so a first write still lands
 * somewhere sensible.
 */
export function resolveCourseFieldPath(
  courses: unknown,
  courseId: string,
  semester?: string
): string[] {
  const wanted = normalizeCourseKey(courseId);
  const map =
    courses && typeof courses === 'object'
      ? (courses as Record<string, unknown>)
      : {};

  const inBucket = (bucketKey: string): string | undefined => {
    const bucket = map[bucketKey];
    if (!bucket || typeof bucket !== 'object') return undefined;
    return Object.keys(bucket as Record<string, unknown>).find(
      (k) => normalizeCourseKey(k) === wanted
    );
  };

  if (semester) {
    const hit = inBucket(semester);
    if (hit) return ['courses', semester, hit];
  }

  const wantedSemester = normalizeSemesterName(semester);
  for (const [key, val] of Object.entries(map)) {
    if (typeof val !== 'string') continue;
    const sepIdx = key.indexOf('|||');
    if (sepIdx === -1) continue;
    if (normalizeCourseKey(key.slice(sepIdx + 3)) !== wanted) continue;
    if (
      wantedSemester &&
      normalizeSemesterName(key.slice(0, sepIdx)) !== wantedSemester
    )
      continue;
    return ['courses', key];
  }

  for (const bucketKey of Object.keys(map)) {
    const hit = inBucket(bucketKey);
    if (hit) return ['courses', bucketKey, hit];
  }

  for (const [key, val] of Object.entries(map)) {
    if (typeof val === 'string' && normalizeCourseKey(key) === wanted) {
      return ['courses', key];
    }
  }

  return semester ? ['courses', semester, courseId] : ['courses', courseId];
}
