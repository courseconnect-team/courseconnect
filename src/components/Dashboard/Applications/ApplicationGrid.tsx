'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Tooltip,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import type { ColumnDef } from '@tanstack/react-table';

import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { collection, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/firebase/auth/auth_context';
import { emailToUsername } from '@/utils/email';
import { normalizeCourseKey } from '@/utils/courseSupervisor';
import { semesterRank, normalizeSemesters } from '@/utils/semester';
import { prettyCourseId } from '@/hooks/useSemesterOptions';
import {
  flattenCourseStatuses,
  normalizeSemesterName,
  resolveCourseFieldPath,
  type FlatCourseEntry,
} from '@/utils/approvalAssignments';

import AppView from './AppView';
import { courseStatusPill } from './courseStatus';
import ApprovedInstructorsDialog, {
  type ApplyAssignmentChange,
} from './ApprovedInstructorsDialog';
import {
  AdminDataTable,
  ConfirmDialog,
  RowActionButton,
  StatusPill,
  type StatusTone,
} from '@/components/common/AdminDataTable';

// ─── types ──────────────────────────────────────────────────────────────────
interface Application {
  id: string;
  additionalprompt?: string;
  available_hours?: string;
  available_semesters?: string | string[];
  courses?: string[];
  /**
   * Courses the admin already assigned. Stored 'accepted' rather than
   * 'approved', so they'd otherwise drop out of the Approved column the moment
   * a student was assigned — leaving nothing to click.
   */
  acceptedCourses?: string[];
  allcourses?: string[];
  assignedCourses?: string;
  assignedSemesters?: string;
  date?: string;
  degree?: string;
  department?: string;
  email?: string;
  englishproficiency?: string;
  firstname?: string;
  lastname?: string;
  gpa?: string;
  nationality?: string;
  phonenumber?: string;
  position?: string;
  qualifications?: string;
  semesterstatus?: string;
  ufid?: string;
  status?: string;
}

interface ApplicationGridProps {
  userRole: string;
}

/** One option in the assign dialog: the course label and its faculty status. */
interface AssignCourseOption {
  /** `${courseId} (${semester})` — parsed back apart on submit. */
  label: string;
  status: string;
}

// ─── firestore helpers ──────────────────────────────────────────────────────
const applicationsSubcollection = () =>
  firebase
    .firestore()
    .collection('applications')
    .doc('course_assistant')
    .collection('uid');

const applicationDoc = (id: string) => applicationsSubcollection().doc(id);

// Render a course entry with its semester so users can disambiguate the
// same (course, instructor) appearing across terms.
function formatCourseLabel(e: FlatCourseEntry): string {
  return e.semester ? `${e.courseId} (${e.semester})` : e.courseId;
}

// Human-readable version of a formatCourseLabel string — runs prettyCourseId
// on the courseId portion while preserving the " (Semester)" suffix.
function prettyLabel(label: string): string {
  const m = label.match(/^(.*) \(([^)]+)\)$/);
  const courseId = m ? m[1] : label;
  const semester = m ? m[2] : null;
  const pretty = prettyCourseId(courseId);
  return semester ? `${pretty} (${semester})` : pretty;
}

// ─── status display ─────────────────────────────────────────────────────────
function statusToTone(status?: string): StatusTone {
  const s = (status || '').toLowerCase();
  if (s.includes('approved')) return 'success';
  if (s.includes('denied')) return 'danger';
  if (s.includes('pending')) return 'warning';
  return 'neutral';
}

function prettyStatus(status?: string): string {
  if (!status) return 'Pending';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Notify a student that admin approved them onto a course.
async function sendApproveEmail(assignment: any) {
  try {
    const snap = await applicationDoc(assignment.student_uid).get();
    if (!snap.exists) return;
    const d = snap.data() as Application;
    await fetch(
      'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/sendEmail',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'applicationStatusApproved',
          data: {
            user: {
              name: `${d.firstname ?? ''} ${d.lastname ?? ''}`.trim(),
              email: d.email,
            },
            position: assignment.position,
            classCode: assignment.class_codes,
          },
        }),
      }
    );
  } catch (error) {
    console.error('Error sending approve email:', error);
  }
}

// Point a course's per-course status at its real storage slot. Both halves of a
// course id are free text, so a dotted instructor name ("Smith, John A.") would
// break a dotted field-path string — hence FieldPath segments.
function courseStatusUpdate(
  courses: unknown,
  courseId: string,
  semester: string | null | undefined
) {
  const segments = resolveCourseFieldPath(
    courses,
    courseId,
    semester ?? undefined
  );
  return new firebase.firestore.FieldPath(...segments);
}

// Assign a student to one course: writes the assignments doc, flips the
// application's per-course status, and sends the student and faculty notices.
//
// Shared by the row-level Approve action and the approved-instructors dialog so
// an assignment made either way carries identical fields — the OnBase export
// reads them straight off this doc.
async function createAssignment(params: {
  studentUid: string;
  courseId: string;
  semester: string | null;
  hours: string | number;
}): Promise<void> {
  const { studentUid, courseId, hours } = params;
  const doc = await applicationDoc(studentUid).get();

  const courseRef = firebase.firestore().collection('courses').doc(courseId);
  const courseDoc = await getDoc(courseRef);

  const existingCourses = doc.data()?.courses || {};
  let semesterBucket: string | null = params.semester;
  if (!semesterBucket) {
    for (const [semKey, val] of Object.entries(existingCourses)) {
      if (
        val &&
        typeof val === 'object' &&
        courseId in (val as Record<string, unknown>)
      ) {
        semesterBucket = semKey;
        break;
      }
    }
  }

  const priorCourseStatus =
    flattenCourseStatuses(existingCourses).find(
      (e) =>
        normalizeCourseKey(e.courseId) === normalizeCourseKey(courseId) &&
        (!semesterBucket ||
          normalizeSemesterName(e.semester) ===
            normalizeSemesterName(semesterBucket))
    )?.status ?? 'approved';

  // Mark the assigned course 'accepted' (admin-assigned), not 'approved'
  // (faculty-approved). The student status page reads per-course state to
  // label "Accepted" — using 'approved' here would flip every other
  // faculty-approved course to "Accepted" too.
  await applicationDoc(studentUid).update(
    'status',
    'Admin_approved',
    courseStatusUpdate(existingCourses, courseId, semesterBucket),
    'accepted'
  );

  const now = new Date();
  // Record the specific semester the admin picked in the assign dialog —
  // not the application's submission-time `available_semesters`, which
  // spans the next 3 terms and would mis-label a Summer hire as Spring
  // when the student applied in the prior term.
  const assignmentSemesters = semesterBucket
    ? [semesterBucket]
    : doc.data()?.available_semesters;

  // Returning-hire detection: if this person already holds an assignment
  // from an earlier semester, this is a re-appointment, not a new hire.
  // Match on student_uid (how docs are keyed here) and ufid (covers rows
  // imported from HR that carry a ufid but no student_uid). Only semesters
  // strictly earlier than the one being assigned count — a second course in
  // the same term is still a new hire.
  const thisUfid = String(doc.data()?.ufid ?? '').trim();
  const newRank = Math.max(
    ...normalizeSemesters(assignmentSemesters)
      .map((s) => semesterRank(s))
      .filter((r): r is number => r != null),
    -Infinity
  );
  let hasEarlierSemester = false;
  try {
    const assignmentsColRef = collection(firebase.firestore(), 'assignments');
    const priorSnaps = await Promise.all([
      getDocs(query(assignmentsColRef, where('student_uid', '==', studentUid))),
      thisUfid
        ? getDocs(query(assignmentsColRef, where('ufid', '==', thisUfid)))
        : Promise.resolve(null),
    ]);
    for (const snap of priorSnaps) {
      if (!snap) continue;
      for (const priorDoc of snap.docs) {
        const priorRanks = normalizeSemesters(priorDoc.data()?.semesters)
          .map((s) => semesterRank(s))
          .filter((r): r is number => r != null);
        if (priorRanks.some((r) => r < newRank)) {
          hasEarlierSemester = true;
          break;
        }
      }
      if (hasEarlierSemester) break;
    }
  } catch (err) {
    // Non-fatal: fall back to NEW HIRE if the lookup fails.
    console.error('Reappoint lookup failed; defaulting to NEW HIRE:', err);
  }
  const requestedAction = hasEarlierSemester ? 'REAPPOINT' : 'NEW HIRE';

  const assignment = {
    date: `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`,
    student_uid: studentUid,
    class_codes: courseId,
    email: doc.data()?.email,
    name: `${doc.data()?.firstname ?? ''} ${doc.data()?.lastname ?? ''}`,
    semesters: assignmentSemesters,
    department: doc.data()?.department,
    hours: [Number(hours) || 0],
    position: doc.data()?.position,
    degree: doc.data()?.degree,
    ufid: doc.data()?.ufid,
    requested_action: requestedAction,
    // Remembered so a later de-assignment can hand the course back to the
    // state it was in — 'approved' when a professor signed off, 'applied'
    // when the admin assigned a course no professor had approved.
    prior_course_status: priorCourseStatus,
  };

  const assignmentsCol = firebase.firestore().collection('assignments');
  const primaryRef = assignmentsCol.doc(studentUid);
  const primaryDoc = await primaryRef.get();

  if (primaryDoc.exists) {
    let counter = 1;
    let newRef = assignmentsCol.doc(`${studentUid}-${counter}`);
    while ((await newRef.get()).exists) {
      counter++;
      newRef = assignmentsCol.doc(`${studentUid}-${counter}`);
    }
    await newRef.set(assignment);
  } else {
    await primaryRef.set(assignment);
  }

  // notify professors
  const emailArray = courseDoc
    .data()
    ?.professor_emails?.split?.(';')
    ?.map?.((email: string) => email.trim());
  if (emailArray) {
    for (const email of emailArray) {
      try {
        await fetch(
          'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/sendEmail',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'facultyAssignment',
              data: {
                userEmail: email,
                position: doc.data()?.position,
                classCode: courseDoc.data()?.code,
                semester: courseDoc.data()?.semester,
              },
            }),
          }
        );
      } catch (err) {
        console.error('Error notifying professor:', err);
      }
    }
  }

  await sendApproveEmail(assignment);
}

// Undo one assignment: drop the assignments doc and hand the course back to the
// faculty-approved state it held before the admin accepted it.
//
// The application's top-level status only reverts once the student holds
// nothing at all — a student assigned to two courses is still Admin_approved
// after losing one of them.
async function removeAssignment(params: {
  studentUid: string;
  assignmentId: string;
  courseId: string;
  semester: string | null;
}): Promise<void> {
  const { studentUid, assignmentId, courseId, semester } = params;

  const assignmentRef = firebase
    .firestore()
    .collection('assignments')
    .doc(assignmentId);
  const priorStatus = String(
    (await assignmentRef.get()).data()?.prior_course_status ?? ''
  ).trim();
  await assignmentRef.delete();

  const doc = await applicationDoc(studentUid).get();
  if (!doc.exists) return;
  const data = doc.data() ?? {};

  const stillAssigned = await getDocs(
    query(
      collection(firebase.firestore(), 'assignments'),
      where('student_uid', '==', studentUid)
    )
  );

  // Only revert the slot this assignment actually claimed. The same course can
  // be accepted in two terms, and reverting the wrong one would strip a
  // still-live assignment's 'accepted' status.
  const wasAccepted = flattenCourseStatuses(data.courses).some(
    (e) =>
      normalizeCourseKey(e.courseId) === normalizeCourseKey(courseId) &&
      (!semester ||
        !e.semester ||
        normalizeSemesterName(e.semester) ===
          normalizeSemesterName(semester)) &&
      e.status.trim().toLowerCase() === 'accepted'
  );

  const updates: unknown[] = [];
  if (wasAccepted) {
    // Assignments predating `prior_course_status` fall back to 'approved',
    // which is what all but the admin-overrode case was.
    updates.push(
      courseStatusUpdate(data.courses, courseId, semester),
      priorStatus && priorStatus !== 'accepted' ? priorStatus : 'approved'
    );
  }
  if (stillAssigned.empty && data.status === 'Admin_approved') {
    updates.push('status', 'Submitted');
  }
  if (updates.length) {
    await (applicationDoc(studentUid).update as any)(...updates);
  }
}

// ─── component ──────────────────────────────────────────────────────────────
export default function ApplicationGrid({ userRole }: ApplicationGridProps) {
  const { user } = useAuth();
  const [applicationData, setApplicationData] = React.useState<Application[]>(
    []
  );
  const [loading, setLoading] = React.useState(false);
  const [listLoading, setListLoading] = React.useState(true);

  // dialog state
  const [viewOpen, setViewOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [denyId, setDenyId] = React.useState<string | null>(null);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assignCourses, setAssignCourses] = React.useState<
    AssignCourseOption[]
  >([]);
  // Selected courses, each with its own weekly hours. Hours are per-assignment
  // on the OnBase export, so two courses can't share one figure.
  const [assignSelection, setAssignSelection] = React.useState<
    Record<string, string>
  >({});
  const [approvalsRow, setApprovalsRow] = React.useState<Application | null>(
    null
  );

  // fetch data
  React.useEffect(() => {
    const ref = applicationsSubcollection();
    if (userRole === 'admin') {
      const unsubscribe = ref.onSnapshot((snap) => {
        const data = snap.docs
          .filter((doc) => {
            const d = doc.data();
            if (d.status === 'Admin_denied') return false;
            const flat = flattenCourseStatuses(d.courses);
            if (d.status === 'Admin_approved' && flat.length < 2) {
              return false;
            }
            return true;
          })
          .map((doc) => {
            const d = doc.data();
            const flat = flattenCourseStatuses(d.courses);
            return {
              id: doc.id,
              ...d,
              courses: flat
                .filter((e) => e.status === 'approved')
                .map(formatCourseLabel),
              acceptedCourses: flat
                .filter((e) => e.status === 'accepted')
                .map(formatCourseLabel),
              allcourses: flat.map(formatCourseLabel),
            } as Application;
          });
        setApplicationData(data);
        setListLoading(false);
      });
      return () => unsubscribe();
    }

    if (userRole === 'faculty') {
      const facultyCourses = collection(firebase.firestore(), 'courses');
      const q = query(
        facultyCourses,
        where(
          'professor_usernames',
          'array-contains',
          emailToUsername(user?.email)
        )
      );
      getDocs(q).catch(() => undefined);

      Promise.all([
        ref.get(),
        firebase.firestore().collection('assignments').get(),
      ]).then(([appSnap, assignSnap]) => {
        const assignByUid: Record<
          string,
          { class_codes?: string; semesters?: string[] }[]
        > = {};
        assignSnap.docs.forEach((doc) => {
          const d = doc.data();
          const uid = d.student_uid as string;
          if (uid) {
            if (!assignByUid[uid]) assignByUid[uid] = [];
            assignByUid[uid].push({
              class_codes: d.class_codes,
              semesters: d.semesters,
            });
          }
        });

        const data = appSnap.docs.map((doc) => {
          const d = doc.data();
          const assigns = assignByUid[doc.id] ?? [];
          const assignedCourses = assigns
            .map((a) => a.class_codes)
            .filter(Boolean)
            .join(', ');
          const seenSemesters = new Set<string>();
          assigns.forEach((a) =>
            (a.semesters ?? []).forEach((s) => seenSemesters.add(s))
          );
          const assignedSemesters = Array.from(seenSemesters).join(', ');
          return {
            id: doc.id,
            ...d,
            assignedCourses,
            assignedSemesters,
          } as Application;
        });
        setApplicationData(data);
        setListLoading(false);
      });
    }
  }, [userRole, user?.email]);

  // ─── handlers ─────────────────────────────────────────────────────────────
  const handleViewOpen = (id: string) => {
    setSelectedId(id);
    setViewOpen(true);
  };
  const handleViewClose = () => setViewOpen(false);

  const handleOpenAssignmentDialog = async (id: string) => {
    const doc = await applicationDoc(id).get();
    const flat = flattenCourseStatuses(doc.data()?.courses);
    // Admin approval supersedes faculty: allow assigning any course the
    // applicant applied for, even if no faculty member has approved it
    // yet. Labels include the semester so admins can disambiguate the
    // same (course, instructor) appearing across multiple terms — the
    // submit handler parses the semester back out of the label.
    // Carry each course's status through so the list can say which ones a
    // professor actually approved — the bypass above means most of these
    // haven't been.
    setAssignCourses(
      flat.map((e) => ({ label: formatCourseLabel(e), status: e.status }))
    );
    setAssignSelection({});
    setSelectedId(id);
    setAssignOpen(true);
  };

  const handleCloseAssignmentDialog = () => setAssignOpen(false);

  const handleOpenDenyDialog = (id: string) => {
    setDenyId(id);
  };

  const sendDenyEmail = async (id: string) => {
    try {
      const snapshot = await applicationDoc(id).get();
      if (!snapshot.exists) return;
      const d = snapshot.data() as Application;
      await fetch(
        'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/sendEmail',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'applicationStatusDenied',
            data: {
              user: {
                name: `${d.firstname ?? ''} ${d.lastname ?? ''}`.trim(),
                email: d.email,
              },
              position: d.position,
              classCode: d.courses,
            },
          }),
        }
      );
    } catch (error) {
      console.error('Error sending deny email:', error);
    }
  };

  const handleConfirmDeny = async () => {
    if (!denyId) return;
    setLoading(true);
    try {
      await applicationDoc(denyId).update({ status: 'Admin_denied' });
      setApplicationData((prev) => prev.filter((r) => r.id !== denyId));
      await sendDenyEmail(denyId);
    } catch (error) {
      console.error('Error denying application: ', error);
    } finally {
      setLoading(false);
      setDenyId(null);
    }
  };

  const assignCount = Object.keys(assignSelection).length;

  const toggleAssignCourse = (label: string) =>
    setAssignSelection((prev) => {
      if (label in prev) {
        const { [label]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [label]: '0' };
    });

  const handleSubmitAssignment = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const picked = Object.entries(assignSelection);
    if (!selectedId || !picked.length) return;
    setLoading(true);

    try {
      // Assign-dialog options come back as `${courseId} (${semester})` so
      // the same (course, instructor) appearing in two terms is
      // distinguishable. Parse the suffix back out — createAssignment falls
      // through to a best-effort lookup when the label has no semester
      // (legacy entries).
      //
      // Sequential, not Promise.all: each createAssignment picks the next free
      // `${uid}-N` doc id by reading what already exists, so two running at
      // once would land on the same id and one would overwrite the other.
      for (const [label, hours] of picked) {
        const labelMatch = label.match(/^(.*) \(([^)]+)\)$/);
        await createAssignment({
          studentUid: selectedId,
          courseId: labelMatch ? labelMatch[1] : label,
          semester: labelMatch ? labelMatch[2] : null,
          hours,
        });
      }
      handleCloseAssignmentDialog();
    } catch (error) {
      console.error('Error approving application:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply the approved-instructors dialog: de-assign, assign, or move the
  // student from one approving instructor to another.
  //
  // Removals run first so a reassignment never leaves the student momentarily
  // holding both courses — which would also make the new assignment's
  // returning-hire lookup trip over the one being replaced.
  const handleApplyAssignmentChange = async ({
    studentUid,
    removals,
    additions,
    hours,
  }: ApplyAssignmentChange) => {
    for (const entry of removals) {
      if (!entry.assignmentId) continue;
      await removeAssignment({
        studentUid,
        assignmentId: entry.assignmentId,
        courseId: entry.courseId,
        semester: entry.semester || null,
      });
    }
    for (const entry of additions) {
      await createAssignment({
        studentUid,
        courseId: entry.courseId,
        semester: entry.semester || null,
        hours,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await applicationDoc(deleteId).delete();
      setApplicationData((prev) => prev.filter((r) => r.id !== deleteId));
    } catch (error) {
      console.error('Error deleting application:', error);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  // direct approve (faculty flow)
  const handleFacultyApprove = async (id: string) => {
    setLoading(true);
    try {
      await applicationDoc(id).update({ status: 'Approved' });
      setApplicationData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r))
      );
    } catch (error) {
      console.error('Error approving application:', error);
    } finally {
      setLoading(false);
    }
  };

  // direct deny (faculty flow)
  const handleFacultyDeny = async (id: string) => {
    setLoading(true);
    try {
      await applicationDoc(id).update({ status: 'Admin_denied' });
      setApplicationData((prev) => prev.filter((r) => r.id !== id));
      await sendDenyEmail(id);
    } catch (error) {
      console.error('Error denying application:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── columns ──────────────────────────────────────────────────────────────
  const adminColumns = React.useMemo<ColumnDef<Application, any>[]>(
    () => [
      {
        id: 'firstName',
        header: 'First Name',
        accessorFn: (row) => row.firstname ?? '',
        cell: ({ getValue }) => (
          <Box sx={{ fontWeight: 500, color: '#111827' }}>
            {(getValue() as string) || '—'}
          </Box>
        ),
        size: 130,
      },
      {
        id: 'lastName',
        header: 'Last Name',
        accessorFn: (row) => row.lastname ?? '',
        cell: ({ getValue }) => (
          <Box sx={{ fontWeight: 500, color: '#111827' }}>
            {(getValue() as string) || '—'}
          </Box>
        ),
        size: 130,
      },
      {
        id: 'email',
        header: 'Email',
        accessorKey: 'email',
        cell: ({ getValue }) => getValue() || '—',
        size: 220,
      },
      {
        id: 'degree',
        header: 'Degree',
        accessorKey: 'degree',
        cell: ({ getValue }) => getValue() || '—',
        size: 90,
      },
      {
        id: 'available_semesters',
        header: 'Semester(s)',
        accessorFn: (row) =>
          Array.isArray(row.available_semesters)
            ? row.available_semesters.join(', ')
            : row.available_semesters || '',
        cell: ({ getValue }) => getValue() || '—',
        size: 140,
      },
      {
        id: 'allcourses',
        header: 'All Courses',
        accessorFn: (row) => (row.allcourses || []).map(prettyLabel).join(', '),
        cell: ({ getValue }) => (getValue() as string) || '—',
        size: 220,
        meta: { maxWidth: 220 },
      },
      {
        id: 'approved_courses',
        header: 'Approved Courses',
        // Assigned course first: it is the one an admin scanning the column is
        // usually looking for. Search and CSV export read this same string.
        accessorFn: (row) =>
          [...(row.acceptedCourses || []), ...(row.courses || [])]
            .map(prettyLabel)
            .join(', '),
        cell: ({ row, getValue }) => {
          const v = getValue() as string;
          if (!v) return <span style={{ color: '#9CA3AF' }}>—</span>;
          const count =
            (row.original.acceptedCourses || []).length +
            (row.original.courses || []).length;
          return (
            <Tooltip title="View every instructor who approved this student">
              <Box
                component="button"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setApprovalsRow(row.original);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  maxWidth: '100%',
                  border: 'none',
                  background: 'none',
                  p: 0,
                  font: 'inherit',
                  color: '#065F46',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <Box
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {v}
                </Box>
                {count > 1 && (
                  <Box
                    component="span"
                    sx={{
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#065F46',
                      backgroundColor: '#D1FAE5',
                      borderRadius: '10px',
                      px: 0.75,
                      py: '1px',
                    }}
                  >
                    +{count - 1}
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        },
        size: 220,
        meta: { maxWidth: 220 },
      },
      {
        id: 'position',
        header: 'Position',
        accessorKey: 'position',
        cell: ({ getValue }) => getValue() || '—',
        size: 90,
      },
      {
        id: 'date',
        header: 'Date',
        accessorKey: 'date',
        cell: ({ getValue }) => getValue() || '—',
        size: 110,
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ getValue }) => {
          const raw = getValue() as string | undefined;
          return (
            <StatusPill label={prettyStatus(raw)} tone={statusToTone(raw)} />
          );
        },
        size: 150,
      },
    ],
    []
  );

  const facultyColumns = React.useMemo<ColumnDef<Application, any>[]>(
    () => [
      {
        id: 'firstName',
        header: 'First Name',
        accessorFn: (row) => row.firstname ?? '',
        cell: ({ getValue }) => (
          <Box sx={{ fontWeight: 500, color: '#111827' }}>
            {(getValue() as string) || '—'}
          </Box>
        ),
        size: 120,
      },
      {
        id: 'lastName',
        header: 'Last Name',
        accessorFn: (row) => row.lastname ?? '',
        cell: ({ getValue }) => (
          <Box sx={{ fontWeight: 500, color: '#111827' }}>
            {(getValue() as string) || '—'}
          </Box>
        ),
        size: 120,
      },
      { id: 'ufid', header: 'UFID', accessorKey: 'ufid', size: 110 },
      { id: 'email', header: 'Email', accessorKey: 'email', size: 200 },
      { id: 'position', header: 'Position', accessorKey: 'position', size: 90 },
      {
        id: 'semesters',
        header: 'Semester(s)',
        accessorFn: (row) =>
          Array.isArray(row.available_semesters)
            ? row.available_semesters.join(', ')
            : row.available_semesters || '',
        size: 140,
      },
      {
        id: 'available_hours',
        header: 'Hours',
        accessorKey: 'available_hours',
        size: 80,
      },
      {
        id: 'courses',
        header: 'Courses',
        accessorFn: (row) =>
          Array.isArray(row.courses)
            ? row.courses.map(prettyLabel).join(', ')
            : row.courses || '',
        size: 180,
        meta: { maxWidth: 180 },
      },
      {
        id: 'semesterstatus',
        header: 'Academic Status',
        accessorKey: 'semesterstatus',
        size: 140,
      },
      { id: 'date', header: 'Date', accessorKey: 'date', size: 100 },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ getValue }) => {
          const raw = getValue() as string | undefined;
          return (
            <StatusPill label={prettyStatus(raw)} tone={statusToTone(raw)} />
          );
        },
        size: 140,
      },
      {
        id: 'assignedCourses',
        header: 'Admin Approved Course',
        accessorKey: 'assignedCourses',
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return v ? (
            <Box sx={{ color: '#065F46', fontWeight: 500 }}>{v}</Box>
          ) : (
            <span style={{ color: '#9CA3AF' }}>—</span>
          );
        },
        size: 260,
        meta: { maxWidth: 260 },
      },
      {
        id: 'assignedSemesters',
        header: 'Assigned Semester',
        accessorKey: 'assignedSemesters',
        cell: ({ getValue }) => (getValue() as string) || '—',
        size: 150,
      },
    ],
    []
  );

  const isAdmin = userRole === 'admin';

  const rowActions = (row: Application) =>
    isAdmin ? (
      <>
        <RowActionButton
          variant="icon"
          icon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
          label="View"
          onClick={() => handleViewOpen(row.id)}
        />
        <RowActionButton
          variant="icon"
          icon={<ThumbUpOutlinedIcon sx={{ fontSize: 16 }} />}
          label="Approve"
          tone="success"
          onClick={() => handleOpenAssignmentDialog(row.id)}
        />
        <RowActionButton
          variant="icon"
          icon={<ThumbDownOutlinedIcon sx={{ fontSize: 16 }} />}
          label="Deny"
          tone="danger"
          onClick={() => handleOpenDenyDialog(row.id)}
        />
        <RowActionButton
          variant="icon"
          icon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
          label="Delete"
          tone="neutral"
          onClick={() => setDeleteId(row.id)}
        />
      </>
    ) : (
      <>
        <RowActionButton
          variant="icon"
          icon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
          label="View"
          onClick={() => handleViewOpen(row.id)}
        />
        <RowActionButton
          variant="icon"
          icon={<ThumbUpOutlinedIcon sx={{ fontSize: 16 }} />}
          label="Approve"
          tone="success"
          onClick={() => handleFacultyApprove(row.id)}
        />
        <RowActionButton
          variant="icon"
          icon={<ThumbDownOutlinedIcon sx={{ fontSize: 16 }} />}
          label="Deny"
          tone="danger"
          onClick={() => handleFacultyDeny(row.id)}
        />
      </>
    );

  return (
    <Box>
      <AdminDataTable
        data={applicationData}
        columns={isAdmin ? adminColumns : facultyColumns}
        loading={loading || listLoading}
        getRowId={(r) => r.id}
        searchPlaceholder="Search applicants by name, email, course…"
        tableId={`applications-${userRole}`}
        exportFilename="applications.csv"
        rowActions={rowActions}
        emptyState={{
          title: 'No applications yet',
          description: isAdmin
            ? 'When students submit applications, they will appear here for review.'
            : 'Applications for your courses will appear here.',
        }}
        minWidth={1200}
      />

      {/* View dialog */}
      <Dialog
        open={viewOpen}
        onClose={handleViewClose}
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: { xs: '90vw', md: '900px' },
          },
        }}
      >
        {selectedId && (
          <AppView
            close={handleViewClose}
            handleDenyClick={(id) => {
              handleViewClose();
              handleOpenDenyDialog(String(id));
            }}
            handleOpenAssignmentDialog={(id) => {
              handleViewClose();
              handleOpenAssignmentDialog(String(id));
            }}
            uid={selectedId}
          />
        )}
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete application"
        description="This will permanently remove the applicant's submission. This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />

      {/* Deny confirm */}
      <ConfirmDialog
        open={Boolean(denyId)}
        title="Deny applicant"
        description="The applicant will be notified by email. You can approve them later if circumstances change."
        confirmLabel="Deny applicant"
        tone="danger"
        onCancel={() => setDenyId(null)}
        onConfirm={handleConfirmDeny}
        loading={loading}
      />

      {/* Approved-instructors dialog: view every approver, assign or move */}
      <ApprovedInstructorsDialog
        open={Boolean(approvalsRow)}
        studentUid={approvalsRow?.id ?? null}
        studentName={`${approvalsRow?.firstname ?? ''} ${
          approvalsRow?.lastname ?? ''
        }`.trim()}
        onClose={() => setApprovalsRow(null)}
        onApply={handleApplyAssignmentChange}
      />

      {/* Course assignment dialog */}
      <Dialog
        open={assignOpen}
        onClose={handleCloseAssignmentDialog}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 420,
            boxShadow: '0 20px 50px -12px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ fontSize: 17, fontWeight: 600 }}>
          Assign courses
        </DialogTitle>
        <form onSubmit={handleSubmitAssignment}>
          <DialogContent>
            {assignCourses.length > 0 ? (
              <>
                <DialogContentText sx={{ mb: 2, fontSize: 14 }}>
                  Select the courses to assign and the weekly hours for each.
                  Courses no professor has approved can still be assigned —
                  admin approval supersedes faculty.
                </DialogContentText>
                <FormGroup sx={{ width: '100%' }}>
                  {assignCourses.map((option) => {
                    const pill = courseStatusPill(option.status);
                    const selected = option.label in assignSelection;
                    // Already assigned: checking it again would write a second
                    // assignment doc for the same course. Existing assignments
                    // are managed from the Approved column instead.
                    const alreadyAssigned =
                      option.status.trim().toLowerCase() === 'accepted';
                    return (
                      <Box key={option.label} sx={{ mb: 0.5 }}>
                        <FormControlLabel
                          checked={selected}
                          disabled={alreadyAssigned}
                          onChange={() => toggleAssignCourse(option.label)}
                          control={<Checkbox size="small" />}
                          label={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                              }}
                            >
                              <span>{prettyLabel(option.label)}</span>
                              <StatusPill label={pill.label} tone={pill.tone} />
                            </Box>
                          }
                          sx={{
                            '& .MuiFormControlLabel-label': { fontSize: 14 },
                          }}
                        />
                        {selected && (
                          <TextField
                            label="Hours per week"
                            type="number"
                            value={assignSelection[option.label]}
                            onChange={(e) =>
                              setAssignSelection((prev) => ({
                                ...prev,
                                [option.label]: e.target.value,
                              }))
                            }
                            size="small"
                            sx={{ ml: 4, mt: 0.5, mb: 1, maxWidth: 180 }}
                            inputProps={{ min: 0 }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </FormGroup>
              </>
            ) : (
              <DialogContentText sx={{ fontSize: 14 }}>
                This applicant has not selected any courses on their
                application.
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCloseAssignmentDialog}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!assignCount || loading}
              sx={{
                textTransform: 'none',
                backgroundColor: '#0021A5',
                '&:hover': { backgroundColor: '#001A85' },
              }}
            >
              {loading
                ? 'Assigning…'
                : assignCount > 1
                ? `Assign ${assignCount} courses`
                : 'Assign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
