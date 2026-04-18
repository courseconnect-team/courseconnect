'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { ColumnDef } from '@tanstack/react-table';

import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { deleteUserHTTPRequest } from '@/firebase/auth/auth_delete_user';
import { isE2EMode } from '@/utils/featureFlags';

import {
  AdminDataTable,
  ConfirmDialog,
  RowActionButton,
  StatusPill,
  type StatusTone,
} from '@/components/common/AdminDataTable';

interface User {
  id: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  department?: string;
  role?: string;
  ufid?: string;
}

interface UserGridProps {
  userRole: string;
}

const DEPARTMENTS = ['ECE', 'CISE', 'MAE', 'Other'];
const ROLES = [
  'admin',
  'faculty',
  'student_assigned',
  'student',
  'unapproved',
  'denied',
];

function roleTone(role?: string): StatusTone {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return 'brand';
  if (r === 'faculty') return 'info';
  if (r === 'student_assigned') return 'success';
  if (r === 'unapproved') return 'warning';
  if (r === 'denied') return 'danger';
  return 'neutral';
}

function prettyRole(role?: string) {
  if (!role) return '—';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function UserGrid({ userRole }: UserGridProps) {
  const e2e = isE2EMode();
  const [loading, setLoading] = React.useState(false);
  const [listLoading, setListLoading] = React.useState(true);
  const [userData, setUserData] = React.useState<User[]>([]);

  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [editForm, setEditForm] = React.useState<Partial<User>>({});

  React.useEffect(() => {
    if (e2e) {
      setUserData([]);
      setListLoading(false);
      return;
    }
    const ref = firebase.firestore().collection('users');
    const unsubscribe = ref.onSnapshot((snap) => {
      const data = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as User)
      );
      setUserData(data);
      setListLoading(false);
    });
    return () => unsubscribe();
  }, [e2e]);

  const openEdit = (user: User) => {
    setEditing(user);
    setEditForm({ ...user });
  };
  const closeEdit = () => {
    setEditing(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const patch = {
        firstname: editForm.firstname ?? '',
        lastname: editForm.lastname ?? '',
        email: editForm.email ?? '',
        department: editForm.department ?? '',
        role: editForm.role ?? '',
      };
      await firebase
        .firestore()
        .collection('users')
        .doc(editing.id)
        .update(patch);
      setUserData((prev) =>
        prev.map((u) => (u.id === editing.id ? { ...u, ...patch } : u))
      );
      closeEdit();
    } catch (error) {
      console.error('Error updating user: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await firebase.firestore().collection('users').doc(deleteId).delete();
      deleteUserHTTPRequest(deleteId);
      setUserData((prev) => prev.filter((u) => u.id !== deleteId));
    } catch (error) {
      console.error('Error deleting user: ', error);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  const columns = React.useMemo<ColumnDef<User, any>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (row) =>
          `${row.firstname ?? ''} ${row.lastname ?? ''}`.trim(),
        cell: ({ row }) => {
          const full = `${row.original.firstname ?? ''} ${
            row.original.lastname ?? ''
          }`.trim();
          return (
            <Box sx={{ fontWeight: 500, color: '#111827' }}>{full || '—'}</Box>
          );
        },
        size: 200,
      },
      {
        id: 'email',
        header: 'Email',
        accessorKey: 'email',
        cell: ({ getValue }) => getValue() || '—',
        size: 260,
      },
      {
        id: 'department',
        header: 'Department',
        accessorKey: 'department',
        cell: ({ getValue }) => getValue() || '—',
        size: 140,
      },
      {
        id: 'role',
        header: 'Role',
        accessorKey: 'role',
        cell: ({ getValue }) => {
          const r = getValue() as string | undefined;
          return <StatusPill label={prettyRole(r)} tone={roleTone(r)} />;
        },
        size: 150,
      },
      {
        id: 'id',
        header: 'User ID',
        accessorKey: 'id',
        cell: ({ getValue }) => (
          <Box
            component="code"
            sx={{
              fontSize: 12,
              color: '#6B7280',
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            }}
          >
            {getValue() as string}
          </Box>
        ),
        size: 280,
        meta: { maxWidth: 280 },
      },
    ],
    []
  );

  return (
    <Box>
      <AdminDataTable
        data={userData}
        columns={columns}
        loading={loading || listLoading}
        getRowId={(r) => r.id}
        searchPlaceholder="Search users by name, email, department…"
        tableId={`users-${userRole}`}
        exportFilename="users.csv"
        rowActions={(row) => (
          <>
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
        )}
        emptyState={{
          title: 'No users yet',
          description: 'Users will appear here once they sign up.',
        }}
        minWidth={1000}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete user"
        description="This removes the account from both Firestore and Firebase Auth. The user will no longer be able to sign in."
        confirmLabel="Delete user"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />

      <Dialog
        open={Boolean(editing)}
        onClose={loading ? undefined : closeEdit}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 480,
            boxShadow: '0 20px 50px -12px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ fontSize: 17, fontWeight: 600 }}>
          Edit user
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="First name"
                value={editForm.firstname ?? ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, firstname: e.target.value })
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Last name"
                value={editForm.lastname ?? ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, lastname: e.target.value })
                }
              />
            </Stack>
            <TextField
              size="small"
              label="Email"
              type="email"
              value={editForm.email ?? ''}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
            />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Department"
                select
                value={editForm.department ?? ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, department: e.target.value })
                }
              >
                {DEPARTMENTS.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                size="small"
                label="Role"
                select
                value={editForm.role ?? ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, role: e.target.value })
                }
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {prettyRole(r)}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
              User ID:{' '}
              <Box
                component="code"
                sx={{ fontFamily: 'monospace', fontSize: 11 }}
              >
                {editing?.id}
              </Box>
            </Typography>
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
    </Box>
  );
}
