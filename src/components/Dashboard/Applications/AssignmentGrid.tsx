'use client';

import * as React from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import type { ColumnDef, VisibilityState } from '@tanstack/react-table';

import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

import AssignView from './AssignView';
import AssignViewOnly from './AssignViewOnly';

import {
  AdminDataTable,
  ConfirmDialog,
  RowActionButton,
} from '@/components/common/AdminDataTable';

interface Assignment {
  id: string;
  approver_name?: string;
  approver_role?: string;
  approver_uid?: string;
  date?: string;
  firstName?: string;
  lastName?: string;
  year?: string;
  fte?: number;
  pname?: string;
  pid?: string;
  hr?: number;
  bwr?: number;
  name?: string;
  email?: string;
  ufid?: string;
  supervisor_ufid?: string;
  proxyUfid?: string;
  class_codes?: string;
  department?: string;
  semesters?: string[];
  hours?: number[];
  position?: string;
  degree?: string;
  start_date?: string;
  end_date?: string;
  percentage?: string;
  annual_rate?: string;
  biweekly_rate?: string;
  target_amount?: string;
  title?: string;
  remote?: string;
}

interface AssignmentGridProps {
  userRole: string;
}

function parseSemester(semesters: string[] | undefined) {
  if (!semesters || !semesters.length) return { term: '—', year: '' };
  const first = semesters[0];
  const term = first.toLowerCase().includes('fall')
    ? 'FALL'
    : first.toLowerCase().includes('spring')
    ? 'SPRING'
    : first.toLowerCase().includes('summer')
    ? 'SUMMER'
    : '—';
  const year = first.split(' ')[1] || '';
  return { term, year };
}

// By default, show only the high-signal columns. Everything else is still
// CSV-exportable via the column-visibility menu.
const DEFAULT_HIDDEN: VisibilityState = {
  supervisor_ufid: false,
  proxyUfid: false,
  proxyFirstName: false,
  proxyLastName: false,
  proxyEmail: false,
  action: false,
  pid: false,
  pname: false,
  start_date: false,
  end_date: false,
  percentage: false,
  annual_rate: false,
  biweekly_rate: false,
  hr: false,
  target_amount: false,
  title: false,
  class_codes: false,
  Imported: false,
  remote: false,
};

export default function AssignmentGrid({ userRole }: AssignmentGridProps) {
  void userRole;

  const [loading, setLoading] = React.useState(false);
  const [listLoading, setListLoading] = React.useState(true);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);

  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [viewId, setViewId] = React.useState<string | null>(null);
  const [editId, setEditId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ref = firebase.firestore().collection('assignments');
    const unsubscribe = ref.onSnapshot((snap) => {
      const data: Assignment[] = snap.docs.map((doc) => {
        const d = doc.data();
        const [firstName = ' ', lastName = ' '] = (d.name || '').split(' ');
        const { year } = parseSemester(d.semesters);
        return {
          id: doc.id,
          ...d,
          firstName,
          lastName,
          year,
          fte: 15,
          pname: 'DEPARTMENT TA/UPIS',
          pid: '000108927',
          hr: 15,
        } as Assignment;
      });
      setAssignments(data);
      setListLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await firebase
        .firestore()
        .collection('assignments')
        .doc(deleteId)
        .delete();
      setAssignments((prev) => prev.filter((a) => a.id !== deleteId));
    } catch (error) {
      console.error('Error deleting assignment:', error);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  const columns = React.useMemo<ColumnDef<Assignment, any>[]>(
    () => [
      {
        id: 'ufid',
        header: 'Student UFID',
        accessorKey: 'ufid',
        cell: ({ getValue }) => (
          <Box
            component="code"
            sx={{
              fontSize: 12,
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              color: '#6B7280',
            }}
          >
            {(getValue() as string) || '—'}
          </Box>
        ),
        size: 140,
      },
      {
        id: 'fullname',
        header: 'Name',
        accessorFn: (r) => `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
        cell: ({ getValue }) => (
          <Box sx={{ fontWeight: 500, color: '#111827' }}>
            {(getValue() as string) || '—'}
          </Box>
        ),
        size: 200,
      },
      {
        id: 'email',
        header: 'Email',
        accessorKey: 'email',
        cell: ({ getValue }) => (getValue() as string) || '—',
        size: 220,
      },
      {
        id: 'class_codes_display',
        header: 'Course',
        accessorKey: 'class_codes',
        cell: ({ getValue }) => {
          const v = getValue() as string | undefined;
          return v ? (
            <Box sx={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</Box>
          ) : (
            <span style={{ color: '#9CA3AF' }}>—</span>
          );
        },
        size: 140,
      },
      {
        id: 'position',
        header: 'Position',
        accessorKey: 'position',
        cell: () => 'TA',
        size: 90,
      },
      {
        id: 'semesters_display',
        header: 'Semester',
        accessorFn: (r) => parseSemester(r.semesters).term,
        size: 110,
      },
      { id: 'year', header: 'Year', accessorKey: 'year', size: 90 },
      {
        id: 'hours',
        header: 'Hours',
        accessorFn: (r) =>
          Array.isArray(r.hours) && typeof r.hours[0] === 'number'
            ? r.hours[0]
            : '',
        size: 80,
      },
      {
        id: 'date',
        header: 'Timestamp',
        accessorKey: 'date',
        cell: ({ getValue }) => (getValue() as string) || '—',
        size: 130,
      },
      {
        id: 'degree',
        header: 'Degree',
        accessorKey: 'degree',
        cell: ({ getValue }) => (getValue() as string) || '—',
        size: 100,
      },
      {
        id: 'supervisor_ufid',
        header: 'Supervisor UFID',
        accessorKey: 'supervisor_ufid',
        size: 150,
      },
      {
        id: 'proxyUfid',
        header: 'Proxy UFID',
        accessorKey: 'proxyUfid',
        size: 130,
      },
      {
        id: 'proxyFirstName',
        header: 'Proxy First',
        accessorFn: () => 'Christophe',
        size: 130,
      },
      {
        id: 'proxyLastName',
        header: 'Proxy Last',
        accessorFn: () => 'Bobda',
        size: 130,
      },
      {
        id: 'proxyEmail',
        header: 'Proxy Email',
        accessorFn: () => 'cbobda@ufl.edu',
        size: 170,
      },
      {
        id: 'action',
        header: 'Requested Action',
        accessorFn: () => 'NEW HIRE',
        size: 140,
      },
      { id: 'pid', header: 'Project ID', accessorKey: 'pid', size: 110 },
      {
        id: 'pname',
        header: 'Project Name',
        accessorFn: () => 'DEPARTMENT TA / UPIS',
        size: 200,
      },
      {
        id: 'start_date',
        header: 'Start Date',
        accessorKey: 'start_date',
        size: 110,
      },
      {
        id: 'end_date',
        header: 'End Date',
        accessorKey: 'end_date',
        size: 110,
      },
      {
        id: 'percentage',
        header: 'Percentage',
        accessorKey: 'percentage',
        size: 100,
      },
      {
        id: 'annual_rate',
        header: 'Annual Rate',
        accessorKey: 'annual_rate',
        size: 110,
      },
      {
        id: 'biweekly_rate',
        header: 'Biweekly Rate',
        accessorKey: 'biweekly_rate',
        size: 110,
      },
      { id: 'hr', header: 'Hourly Rate', accessorKey: 'hr', size: 100 },
      {
        id: 'target_amount',
        header: 'Target Amount',
        accessorKey: 'target_amount',
        size: 120,
      },
      { id: 'title', header: 'Working Title', accessorKey: 'title', size: 150 },
      {
        id: 'class_codes',
        header: 'Duties',
        accessorFn: (r) =>
          `UPI in ${String(r.class_codes ?? '').replace(/,/g, ' ')}`,
        size: 180,
      },
      {
        id: 'fte',
        header: 'FTE',
        accessorFn: (r) => {
          const h = r.hours?.[0];
          if (typeof h !== 'number') return '';
          return Math.floor((h / 1.029411 / 40) * 100) / 100;
        },
        size: 80,
      },
      {
        id: 'Imported',
        header: 'Imported',
        accessorFn: () => 'YES',
        size: 100,
      },
      {
        id: 'remote',
        header: 'Remote',
        accessorFn: (r) => r.remote ?? 'No',
        size: 90,
      },
    ],
    []
  );

  // Apply default-hidden state once on mount via the visibility localStorage
  // Actually, AdminDataTable reads visibility from localStorage on mount if
  // tableId is set. For first-time users we also want DEFAULT_HIDDEN. We wire
  // that via a one-time effect that seeds localStorage if empty.
  React.useEffect(() => {
    const key = 'adt:assignments:vis';
    if (typeof window === 'undefined') return;
    if (!window.localStorage.getItem(key)) {
      window.localStorage.setItem(key, JSON.stringify(DEFAULT_HIDDEN));
    }
  }, []);

  return (
    <Box>
      <AdminDataTable
        data={assignments}
        columns={columns}
        loading={loading || listLoading}
        getRowId={(r) => r.id}
        searchPlaceholder="Search assignments by name, UFID, course…"
        tableId="assignments"
        exportFilename="assignments.csv"
        rowActions={(row) => (
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
              onClick={() => setEditId(row.id)}
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
          title: 'No assignments yet',
          description:
            'Approved applicants with assigned courses will appear here.',
        }}
        minWidth={1300}
      />

      {/* View dialog */}
      <Dialog
        open={Boolean(viewId)}
        onClose={() => setViewId(null)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: { xs: '90vw', md: 900 },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 17,
            fontWeight: 600,
          }}
        >
          <Box sx={{ flex: 1 }}>Assignment details</Box>
          <IconButton size="small" onClick={() => setViewId(null)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewId && <AssignViewOnly uid={viewId} />}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={Boolean(editId)}
        onClose={() => setEditId(null)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: { xs: '90vw', md: 900 },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 17,
            fontWeight: 600,
          }}
        >
          <Box sx={{ flex: 1 }}>Edit assignment</Box>
          <IconButton size="small" onClick={() => setEditId(null)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editId && <AssignView uid={editId} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete assignment"
        description="This removes the assignment record. The applicant's underlying application is unaffected."
        confirmLabel="Delete assignment"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </Box>
  );
}
