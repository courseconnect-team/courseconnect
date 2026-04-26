'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import type { ColumnDef } from '@tanstack/react-table';

import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { useAuth } from '@/firebase/auth/auth_context';
import { isE2EMode } from '@/utils/featureFlags';
import { emailToUsername, emailsToUsernames } from '@/utils/email';

import UnderDevelopment from '@/component/UnderDevelopment';
import {
  AdminDataTable,
  ConfirmDialog,
  RowActionButton,
  StatusPill,
  type StatusTone,
} from '@/components/common/AdminDataTable';

interface Course {
  id: string;
  code?: string;
  title?: string;
  credits?: string | number;
  num_enrolled?: string | number;
  enrollment_cap?: string | number;
  enrolled?: string | number;
  professor_names?: string | string[];
  professor_emails?: string | string[];
  helper_names?: string | string[];
  helper_emails?: string | string[];
  semester?: string;
}

interface CourseGridProps {
  userRole: string;
  semester: string;
  processing?: boolean;
}

function asList(v: string | string[] | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function asText(v: string | string[] | undefined): string {
  return asList(v).join(', ');
}

function enrollmentTone(enrolled?: number, cap?: number): StatusTone {
  if (cap == null || isNaN(cap)) return 'neutral';
  if (enrolled == null) return 'neutral';
  const ratio = enrolled / cap;
  if (ratio >= 1) return 'danger';
  if (ratio >= 0.85) return 'warning';
  return 'success';
}

export default function CourseGrid({
  userRole,
  semester,
  processing,
}: CourseGridProps) {
  const { user } = useAuth();
  const e2e = isE2EMode();
  const userEmail = user?.email;

  const [loading, setLoading] = React.useState(false);
  const [listLoading, setListLoading] = React.useState(true);
  const [courseData, setCourseData] = React.useState<Course[]>([]);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [viewId, setViewId] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Course | null>(null);
  const [editForm, setEditForm] = React.useState<Record<string, string>>({});
  const [success, setSuccess] = React.useState(false);

  const getCoursesCollectionRef = React.useCallback(() => {
    return firebase
      .firestore()
      .collection('semesters')
      .doc(semester)
      .collection('courses');
  }, [semester]);

  React.useEffect(() => {
    setListLoading(true);

    if (e2e || !semester) {
      setCourseData([]);
      setListLoading(false);
      return;
    }

    const coursesRef = getCoursesCollectionRef();
    const onData = (snap: firebase.firestore.QuerySnapshot) => {
      const data = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Course)
      );
      setCourseData(data);
      setListLoading(false);
    };
    const onErr = (err: any) => {
      console.error('Error loading courses:', err);
      setListLoading(false);
    };

    if (userRole === 'admin') {
      coursesRef.get().then(onData).catch(onErr);
    } else if (userRole === 'faculty') {
      const username = emailToUsername(userEmail);
      if (!username) {
        setCourseData([]);
        setListLoading(false);
        return;
      }
      coursesRef
        .where('professor_usernames', 'array-contains', username)
        .get()
        .then(onData)
        .catch(onErr);
    } else if (userRole === 'student_assigned') {
      coursesRef
        .where('helper_emails', 'array-contains', userEmail)
        .get()
        .then(onData)
        .catch(onErr);
    } else {
      setCourseData([]);
      setListLoading(false);
    }
  }, [userRole, userEmail, semester, processing, e2e, getCoursesCollectionRef]);

  const openEdit = (course: Course) => {
    setEditing(course);
    setEditForm({
      code: String(course.code ?? ''),
      title: String(course.title ?? ''),
      credits: String(course.credits ?? ''),
      enrolled: String(course.enrolled ?? ''),
      enrollment_cap: String(course.enrollment_cap ?? ''),
      professor_names: asText(course.professor_names),
      professor_emails: asText(course.professor_emails),
      helper_names: asText(course.helper_names),
      helper_emails: asText(course.helper_emails),
      semester: String(course.semester ?? semester),
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const editedEmails = asList(editForm.professor_emails);
      const patch = {
        code: editForm.code,
        title: editForm.title,
        credits: editForm.credits,
        enrolled: editForm.enrolled,
        enrollment_cap: editForm.enrollment_cap,
        professor_names: asList(editForm.professor_names),
        professor_emails: editedEmails,
        professor_usernames: emailsToUsernames(editedEmails),
        helper_names: asList(editForm.helper_names),
        helper_emails: asList(editForm.helper_emails),
        semester: editForm.semester || semester,
      };
      await getCoursesCollectionRef().doc(editing.id).update(patch);
      setCourseData((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...patch } : c))
      );
      setSuccess(true);
      closeEdit();
    } catch (error) {
      console.error('Error updating course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await getCoursesCollectionRef().doc(deleteId).delete();
      setCourseData((prev) => prev.filter((c) => c.id !== deleteId));
    } catch (error) {
      console.error('Error deleting course:', error);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  const columns = React.useMemo<ColumnDef<Course, any>[]>(
    () => [
      {
        id: 'code',
        header: 'Code',
        accessorKey: 'code',
        cell: ({ getValue }) => (
          <Box
            sx={{
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: 600,
              color: '#111827',
            }}
          >
            {(getValue() as string) || '—'}
          </Box>
        ),
        size: 110,
      },
      {
        id: 'title',
        header: 'Title',
        accessorKey: 'title',
        cell: ({ getValue }) => (
          <Box sx={{ fontWeight: 500, color: '#111827' }}>
            {(getValue() as string) || '—'}
          </Box>
        ),
        size: 260,
        meta: { maxWidth: 260 },
      },
      {
        id: 'credits',
        header: 'Credits',
        accessorKey: 'credits',
        cell: ({ getValue }) => (getValue() as string) || '—',
        size: 80,
      },
      {
        id: 'enrollment',
        header: 'Enrollment',
        accessorFn: (r) => {
          const e = Number(r.enrolled ?? r.num_enrolled ?? 0);
          const c = Number(r.enrollment_cap ?? 0);
          return `${e}/${c}`;
        },
        cell: ({ row }) => {
          const enrolled = Number(
            row.original.enrolled ?? row.original.num_enrolled ?? 0
          );
          const cap = Number(row.original.enrollment_cap ?? 0);
          return (
            <StatusPill
              label={`${enrolled}/${cap || '—'}`}
              tone={enrollmentTone(enrolled, cap || undefined)}
            />
          );
        },
        size: 130,
      },
      {
        id: 'professor_names',
        header: 'Professor',
        accessorFn: (r) => asText(r.professor_names),
        cell: ({ getValue }) => (getValue() as string) || '—',
        size: 200,
        meta: { maxWidth: 200 },
      },
      {
        id: 'professor_emails',
        header: 'Professor Email',
        accessorFn: (r) => asText(r.professor_emails),
        cell: ({ getValue }) => (getValue() as string) || '—',
        size: 220,
        meta: { maxWidth: 220 },
      },
      {
        id: 'semester',
        header: 'Semester',
        accessorKey: 'semester',
        cell: ({ getValue }) => (getValue() as string) || '—',
        size: 130,
      },
    ],
    []
  );

  return (
    <Box>
      <AdminDataTable
        data={courseData}
        columns={columns}
        loading={loading || listLoading}
        getRowId={(r) => r.id}
        searchPlaceholder="Search courses by code, title, professor…"
        tableId={`courses-${userRole}`}
        exportFilename={`courses-${semester || 'all'}.csv`}
        rowActions={(row) =>
          userRole === 'admin' ? (
            <>
              <RowActionButton
                variant="icon"
                icon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                label="View"
                onClick={() => setViewId(row.id)}
              />
              <RowActionButton
                variant="icon"
                icon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
                label="Edit"
                onClick={() => openEdit(row)}
              />
              <RowActionButton
                variant="icon"
                icon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                label="Delete"
                onClick={() => setDeleteId(row.id)}
              />
            </>
          ) : (
            <RowActionButton
              variant="icon"
              icon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
              label="View"
              onClick={() => setViewId(row.id)}
            />
          )
        }
        emptyState={{
          title: 'No courses in this semester',
          description:
            userRole === 'admin'
              ? 'Add a course or upload a course spreadsheet to get started.'
              : 'Courses you are assigned to will appear here once published.',
        }}
        minWidth={1100}
      />

      {/* View dialog (placeholder — existing behavior) */}
      <Dialog
        open={Boolean(viewId)}
        onClose={() => setViewId(null)}
        PaperProps={{ sx: { borderRadius: '12px', minWidth: 480 } }}
      >
        <DialogTitle sx={{ fontSize: 17, fontWeight: 600 }}>
          Course details
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, fontSize: 13, color: '#6B7280' }}>
            Class number: <code>{viewId}</code>
          </Typography>
          <UnderDevelopment />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setViewId(null)}
            sx={{ textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={Boolean(editing)}
        onClose={loading ? undefined : closeEdit}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 560,
            boxShadow: '0 20px 50px -12px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ fontSize: 17, fontWeight: 600 }}>
          Edit course
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Code"
                value={editForm.code ?? ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, code: e.target.value })
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Title"
                value={editForm.title ?? ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Credits"
                value={editForm.credits ?? ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, credits: e.target.value })
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Enrolled"
                value={editForm.enrolled ?? ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, enrolled: e.target.value })
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Capacity"
                value={editForm.enrollment_cap ?? ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, enrollment_cap: e.target.value })
                }
              />
            </Stack>
            <TextField
              size="small"
              label="Professor names (comma-separated)"
              value={editForm.professor_names ?? ''}
              onChange={(e) =>
                setEditForm({ ...editForm, professor_names: e.target.value })
              }
            />
            <TextField
              size="small"
              label="Professor emails (comma-separated)"
              value={editForm.professor_emails ?? ''}
              onChange={(e) =>
                setEditForm({ ...editForm, professor_emails: e.target.value })
              }
            />
            <TextField
              size="small"
              label="Helper names (comma-separated)"
              value={editForm.helper_names ?? ''}
              onChange={(e) =>
                setEditForm({ ...editForm, helper_names: e.target.value })
              }
            />
            <TextField
              size="small"
              label="Helper emails (comma-separated)"
              value={editForm.helper_emails ?? ''}
              onChange={(e) =>
                setEditForm({ ...editForm, helper_emails: e.target.value })
              }
            />
            <TextField
              size="small"
              label="Semester"
              value={editForm.semester ?? ''}
              onChange={(e) =>
                setEditForm({ ...editForm, semester: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeEdit}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: 'none',
              backgroundColor: '#0021A5',
              '&:hover': { backgroundColor: '#001A85' },
            }}
          >
            {loading ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete course"
        description="This will remove the course from the current semester. Students assigned to it will lose the association."
        confirmLabel="Delete course"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccess(false)}
          sx={{ borderRadius: '8px' }}
        >
          Course updated successfully
        </Alert>
      </Snackbar>
    </Box>
  );
}
