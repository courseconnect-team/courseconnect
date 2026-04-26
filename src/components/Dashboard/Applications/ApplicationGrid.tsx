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
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
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

import AppView from './AppView';
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
  allcourses?: string[];
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

// ─── firestore helpers ──────────────────────────────────────────────────────
const applicationsSubcollection = () =>
  firebase
    .firestore()
    .collection('applications')
    .doc('course_assistant')
    .collection('uid');

const applicationDoc = (id: string) => applicationsSubcollection().doc(id);

function flattenCourses(courses: any): Record<string, string> {
  if (!courses || typeof courses !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(courses)) {
    if (val && typeof val === 'object') {
      for (const [courseId, status] of Object.entries(
        val as Record<string, unknown>
      )) {
        if (typeof status === 'string') out[courseId] = status;
      }
    } else if (typeof val === 'string') {
      const bare = key.includes('|||') ? key.split('|||').pop() || key : key;
      out[bare] = val;
    }
  }
  return out;
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
  const [assignCourses, setAssignCourses] = React.useState<string[]>([]);
  const [assignCourse, setAssignCourse] = React.useState('');
  const [assignHours, setAssignHours] = React.useState<string>('0');

  // fetch data
  React.useEffect(() => {
    const ref = applicationsSubcollection();
    if (userRole === 'admin') {
      const unsubscribe = ref.onSnapshot((snap) => {
        const data = snap.docs
          .filter((doc) => {
            const d = doc.data();
            if (d.status === 'Admin_denied') return false;
            const flat = flattenCourses(d.courses);
            if (d.status === 'Admin_approved' && Object.keys(flat).length < 2) {
              return false;
            }
            return true;
          })
          .map((doc) => {
            const d = doc.data();
            const flat = flattenCourses(d.courses);
            return {
              id: doc.id,
              ...d,
              courses: Object.entries(flat)
                .filter(([, v]) => v === 'approved')
                .map(([k]) => k),
              allcourses: Object.keys(flat),
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

      ref.get().then((snap) => {
        const data = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Application)
        );
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
    const flat = flattenCourses(doc.data()?.courses);
    const courses = Object.entries(flat)
      .filter(([, v]) => v === 'approved')
      .map(([k]) => k);
    setAssignCourses(courses);
    setAssignCourse('');
    setAssignHours('0');
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

  const sendApproveEmail = async (assignment: any) => {
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

  const handleSubmitAssignment = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!selectedId || !assignCourse) return;
    setLoading(true);

    try {
      const studentUid = selectedId;
      const doc = await applicationDoc(studentUid).get();
      const courseRef = firebase
        .firestore()
        .collection('courses')
        .doc(assignCourse);
      const courseDoc = await getDoc(courseRef);

      // find the semester bucket holding this course
      const existingCourses = doc.data()?.courses || {};
      let semesterBucket: string | null = null;
      for (const [semKey, val] of Object.entries(existingCourses)) {
        if (
          val &&
          typeof val === 'object' &&
          assignCourse in (val as Record<string, unknown>)
        ) {
          semesterBucket = semKey;
          break;
        }
      }
      const coursePath = semesterBucket
        ? `courses.${semesterBucket}.${assignCourse}`
        : `courses.${assignCourse}`;

      await applicationDoc(studentUid).update({
        status: 'Admin_approved',
        [coursePath]: 'approved',
      });

      const now = new Date();
      const assignment = {
        date: `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`,
        student_uid: studentUid,
        class_codes: assignCourse,
        email: doc.data()?.email,
        name: `${doc.data()?.firstname ?? ''} ${doc.data()?.lastname ?? ''}`,
        semesters: doc.data()?.available_semesters,
        department: doc.data()?.department,
        hours: [Number(assignHours) || 0],
        position: doc.data()?.position,
        degree: doc.data()?.degree,
        ufid: doc.data()?.ufid,
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
      handleCloseAssignmentDialog();
    } catch (error) {
      console.error('Error approving application:', error);
    } finally {
      setLoading(false);
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
        id: 'fullname',
        header: 'Name',
        accessorFn: (row) =>
          `${row.firstname ?? ''} ${row.lastname ?? ''}`.trim(),
        cell: ({ row }) => (
          <Box sx={{ fontWeight: 500, color: '#111827' }}>
            {`${row.original.firstname ?? ''} ${
              row.original.lastname ?? ''
            }`.trim() || '—'}
          </Box>
        ),
        size: 180,
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
        accessorFn: (row) => (row.allcourses || []).join(', '),
        cell: ({ getValue }) => (getValue() as string) || '—',
        size: 220,
        meta: { maxWidth: 220 },
      },
      {
        id: 'approved_courses',
        header: 'Approved Courses',
        accessorFn: (row) => (row.courses || []).join(', '),
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return v ? (
            <Box sx={{ color: '#065F46', fontWeight: 500 }}>{v}</Box>
          ) : (
            <span style={{ color: '#9CA3AF' }}>—</span>
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
        id: 'fullname',
        header: 'Name',
        accessorFn: (row) =>
          `${row.firstname ?? ''} ${row.lastname ?? ''}`.trim(),
        cell: ({ row }) => (
          <Box sx={{ fontWeight: 500, color: '#111827' }}>
            {`${row.original.firstname ?? ''} ${
              row.original.lastname ?? ''
            }`.trim() || '—'}
          </Box>
        ),
        size: 170,
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
            ? row.courses.join(', ')
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
          Assign course
        </DialogTitle>
        <form onSubmit={handleSubmitAssignment}>
          <DialogContent>
            {assignCourses.length > 0 ? (
              <>
                <DialogContentText sx={{ mb: 2, fontSize: 14 }}>
                  Select the course and hours for this assignment.
                </DialogContentText>
                <FormControl required sx={{ width: '100%' }}>
                  <RadioGroup
                    name="course-radio-group"
                    value={assignCourse}
                    onChange={(e) => setAssignCourse(e.target.value)}
                  >
                    {assignCourses.map((code) => (
                      <FormControlLabel
                        key={code}
                        value={code}
                        control={<Radio size="small" />}
                        label={code.replace(/,/g, ', ')}
                        sx={{
                          '& .MuiFormControlLabel-label': { fontSize: 14 },
                        }}
                      />
                    ))}
                  </RadioGroup>
                  <TextField
                    label="Hours per week"
                    type="number"
                    value={assignHours}
                    onChange={(e) => setAssignHours(e.target.value)}
                    size="small"
                    sx={{ mt: 2, maxWidth: 200 }}
                    inputProps={{ min: 0 }}
                  />
                </FormControl>
              </>
            ) : (
              <DialogContentText sx={{ fontSize: 14 }}>
                No faculty member has approved this applicant for any course
                yet.
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
              disabled={!assignCourse || loading}
              sx={{
                textTransform: 'none',
                backgroundColor: '#0021A5',
                '&:hover': { backgroundColor: '#001A85' },
              }}
            >
              {loading ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
