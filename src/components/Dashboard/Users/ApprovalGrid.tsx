'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import type { ColumnDef } from '@tanstack/react-table';

import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { deleteUserHTTPRequest } from '@/firebase/auth/auth_delete_user';

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
}

interface ApprovalGridProps {
  userRole: string;
}

function roleTone(role?: string): StatusTone {
  const r = (role || '').toLowerCase();
  if (r === 'unapproved') return 'warning';
  if (r === 'denied') return 'danger';
  return 'neutral';
}

function prettyRole(role?: string) {
  if (!role) return '—';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ApprovalGrid({ userRole }: ApprovalGridProps) {
  const [loading, setLoading] = React.useState(false);
  const [listLoading, setListLoading] = React.useState(true);
  const [userData, setUserData] = React.useState<User[]>([]);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ref = firebase
      .firestore()
      .collection('users')
      .where('role', '==', 'unapproved');
    const unsubscribe = ref.onSnapshot((snap) => {
      const data = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as User)
      );
      setUserData(data);
      setListLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string) => {
    setLoading(true);
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(id)
        .update({ role: 'faculty' });
      setUserData((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Error approving user: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async (id: string) => {
    setLoading(true);
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(id)
        .update({ role: 'denied' });
      setUserData((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Error denying user: ', error);
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
        size: 220,
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
        header: 'Status',
        accessorKey: 'role',
        cell: ({ getValue }) => {
          const r = getValue() as string | undefined;
          return <StatusPill label={prettyRole(r)} tone={roleTone(r)} />;
        },
        size: 150,
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
        title="Pending approvals"
        description="Faculty and staff awaiting approval to access the platform."
        searchPlaceholder="Search pending users…"
        tableId={`approvals-${userRole}`}
        exportFilename="pending-approvals.csv"
        rowActions={(row) => (
          <>
            <RowActionButton
              variant="icon"
              icon={<ThumbUpOutlinedIcon sx={{ fontSize: 16 }} />}
              label="Approve"
              tone="success"
              onClick={() => handleApprove(row.id)}
            />
            <RowActionButton
              variant="icon"
              icon={<ThumbDownOutlinedIcon sx={{ fontSize: 16 }} />}
              label="Deny"
              tone="danger"
              onClick={() => handleDeny(row.id)}
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
          title: 'No pending approvals',
          description: 'All signups have been reviewed — nothing to see here.',
        }}
        minWidth={900}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete user"
        description="This removes the account permanently from Firestore and Firebase Auth."
        confirmLabel="Delete user"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </Box>
  );
}
