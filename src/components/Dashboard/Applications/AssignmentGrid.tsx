'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import type { ColumnDef, VisibilityState } from '@tanstack/react-table';
import * as XLSX from 'xlsx';

import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { callFunction } from '@/firebase/functions/callFunction';

import AssignView, { type AppViewHandle } from './AssignView';
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
  requested_action?: string;
  ece_special_instructions?: string;
  ece_payroll_notes?: string;
}

interface AssignmentGridProps {
  userRole: string;
}

// Returns the course doc ID stored in class_codes (e.g. "EEL3135 : Wong,Tan Foon")
function parseCourseKey(classCodes: string | undefined): string | null {
  if (!classCodes) return null;
  return classCodes.trim();
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

function EditableTextField({
  value: initialValue,
  onCommit,
}: {
  value: string;
  onCommit: (v: string) => void;
}) {
  const [val, setVal] = React.useState(initialValue);
  React.useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);
  return (
    <TextField
      value={val}
      size="small"
      variant="standard"
      InputProps={{ disableUnderline: true, sx: { fontSize: 13 } }}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onCommit(val)}
      sx={{ minWidth: 100, width: '100%' }}
    />
  );
}

// By default, show only the high-signal columns. Everything else is still
// CSV-exportable via the column-visibility menu.
const DEFAULT_HIDDEN: VisibilityState = {
  supervisor_ufid: false,
  supervisorFirstName: false,
  supervisorLastName: false,
  supervisorEmail: false,
  proxyUfid: false,
  proxyFirstName: false,
  proxyLastName: false,
  proxyEmail: false,
  action: true,
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
  const [courseMap, setCourseMap] = React.useState<
    Record<string, { supervisorFirst: string; supervisorLast: string; supervisorEmail: string }>
  >({});

  const enrichedAssignments = React.useMemo(() => {
    return assignments.map((a) => {
      const key = parseCourseKey(a.class_codes);
      const sup = key ? courseMap[key] : undefined;
      return {
        ...a,
        supervisorFirst: sup?.supervisorFirst ?? 'unknown',
        supervisorLast: sup?.supervisorLast ?? 'unknown',
        supervisorEmail: sup?.supervisorEmail ?? 'unknown',
      };
    });
  }, [assignments, courseMap]);

  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [viewId, setViewId] = React.useState<string | null>(null);
  const [editId, setEditId] = React.useState<string | null>(null);
  const editViewRef = React.useRef<AppViewHandle>(null);
  const [emailRow, setEmailRow] = React.useState<Assignment | null>(null);
  const [emailSending, setEmailSending] = React.useState(false);

  const handleExportExcel = () => {
    const rows = assignments.map((a) => {
      const courseKey = parseCourseKey(a.class_codes);
      const sup = courseKey ? courseMap[courseKey] : undefined;
      return {
        UFID: a.ufid ?? '',
        'First Name': (a.name || '').split(' ')[0] ?? '',
        'Last Name': (a.name || '').split(' ')[1] ?? '',
        Email: a.email ?? '',
        Course: a.class_codes ?? '',
        Position: 'TA',
        Semester: a.semesters?.[0] ?? '',
        Hours: Array.isArray(a.hours) ? a.hours[0] ?? '' : '',
        Degree: a.degree ?? '',
        Department: a.department ?? '',
        'Start Date': a.start_date ?? '',
        'End Date': a.end_date ?? '',
        'Working Title': a.title ?? '',
        Percentage: a.percentage ?? '',
        'Annual Rate': a.annual_rate ?? '',
        'Biweekly Rate': a.biweekly_rate ?? '',
        'Target Amount': a.target_amount ?? '',
        'Supervisor UFID': a.supervisor_ufid ?? '',
        'Supervisor First Name': sup?.supervisorFirst ?? 'unknown',
        'Supervisor Last Name': sup?.supervisorLast ?? 'unknown',
        'Supervisor Email': sup?.supervisorEmail ?? 'unknown',
        'Requested Action': a.requested_action ?? 'NEW HIRE',
        'ECE - Special Instructions': a.ece_special_instructions ?? '',
        'ECE - Payroll Notes': a.ece_payroll_notes ?? '',
        Remote: a.remote ?? '',
        Timestamp: a.date ?? '',
        'Project ID': '000108927',
        'Project Name': 'DEPARTMENT TA/UPIS',
        FTE:
          Array.isArray(a.hours) && typeof a.hours[0] === 'number'
            ? Math.floor((a.hours[0] / 1.029411 / 40) * 100) / 100
            : '',
        'Proxy Name': 'Christophe Bobda',
        'Proxy Email': 'cbobda@ufl.edu',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assignments');
    XLSX.writeFile(wb, 'assignments.xlsx');
  };

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

  React.useEffect(() => {
    const db = firebase.firestore();
    db.collection('semesters')
      .get()
      .then(async (semSnap) => {
        const map: Record<string, { supervisorFirst: string; supervisorLast: string; supervisorEmail: string }> = {};
        await Promise.all(
          semSnap.docs.map(async (semDoc) => {
            const coursesSnap = await semDoc.ref.collection('courses').get();
            coursesSnap.docs.forEach((courseDoc) => {
              const d = courseDoc.data();
              const key = courseDoc.id;
              const profName: string = Array.isArray(d.professor_names)
                ? (d.professor_names[0] as string) ?? ''
                : (d.professor_names as string) ?? '';
              const comma = profName.indexOf(',');
              const last = comma >= 0 ? profName.substring(0, comma).trim() : profName.trim();
              const first = comma >= 0 ? profName.substring(comma + 1).trim() : '';
              const email: string = Array.isArray(d.professor_emails)
                ? (d.professor_emails[0] as string) ?? ''
                : (d.professor_emails as string) ?? '';
              map[key] = { supervisorFirst: first, supervisorLast: last, supervisorEmail: email };
            });
          })
        );
        setCourseMap(map);
      })
      .catch(console.error);
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

  const handleConfirmEmail = async () => {
    if (!emailRow) return;
    setEmailSending(true);
    try {
      await callFunction('sendEmail', {
        type: 'applicationStatusApproved',
        data: {
          user: { name: emailRow.name ?? '', email: emailRow.email ?? '' },
          position: emailRow.position ?? 'TA',
          classCode: emailRow.class_codes ?? '',
        },
      });
    } catch (err) {
      console.error('Failed to send assignment email:', err);
    } finally {
      setEmailSending(false);
      setEmailRow(null);
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
        id: 'firstName',
        header: 'First Name',
        accessorKey: 'firstName',
        cell: ({ getValue }) => (
          <Box sx={{ fontWeight: 500, color: '#111827' }}>
            {(getValue() as string)?.trim() || '—'}
          </Box>
        ),
        size: 130,
      },
      {
        id: 'lastName',
        header: 'Last Name',
        accessorKey: 'lastName',
        cell: ({ getValue }) => (
          <Box sx={{ fontWeight: 500, color: '#111827' }}>
            {(getValue() as string)?.trim() || '—'}
          </Box>
        ),
        size: 130,
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
        id: 'semester',
        header: 'Semester',
        accessorFn: (r) => r.semesters?.[0] ?? '—',
        size: 140,
      },
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
        sortingFn: (rowA, rowB, columnId) => {
          const parse = (v: unknown) => {
            if (typeof v !== 'string' || !v) return 0;
            const [m, d, y] = v.split('-').map(Number);
            return new Date(y, m - 1, d).getTime();
          };
          return (
            parse(rowA.getValue(columnId)) - parse(rowB.getValue(columnId))
          );
        },
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
        id: 'supervisorFirstName',
        header: 'Supervisor First',
        accessorKey: 'supervisorFirst',
        size: 150,
      },
      {
        id: 'supervisorLastName',
        header: 'Supervisor Last',
        accessorKey: 'supervisorLast',
        size: 150,
      },
      {
        id: 'supervisorEmail',
        header: 'Supervisor Email',
        accessorKey: 'supervisorEmail',
        size: 200,
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
        accessorFn: (r) => r.requested_action ?? 'NEW HIRE',
        cell: ({ row }) => {
          const current = row.original.requested_action ?? 'NEW HIRE';
          return (
            <Select
              value={current}
              size="small"
              variant="standard"
              disableUnderline
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const next = e.target.value as string;
                firebase
                  .firestore()
                  .collection('assignments')
                  .doc(row.original.id)
                  .update({ requested_action: next })
                  .catch(console.error);
                setAssignments((prev) =>
                  prev.map((a) =>
                    a.id === row.original.id
                      ? { ...a, requested_action: next }
                      : a
                  )
                );
              }}
              sx={{
                fontSize: 13,
                fontWeight: 500,
                '& .MuiSelect-select': { py: 0.25 },
              }}
            >
              {['NEW HIRE', 'REAPPOINT', 'TERMINATE', 'LEAVE', 'OPS SEMESTER BREAK'].map((opt) => (
                <MenuItem key={opt} value={opt} sx={{ fontSize: 13 }}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          );
        },
        size: 160,
      },
      {
        id: 'ece_special_instructions',
        header: 'ECE - Special Instructions',
        accessorKey: 'ece_special_instructions',
        cell: ({ row }) => (
          <EditableTextField
            value={row.original.ece_special_instructions ?? ''}
            onCommit={(v) => {
              firebase
                .firestore()
                .collection('assignments')
                .doc(row.original.id)
                .update({ ece_special_instructions: v })
                .catch(console.error);
              setAssignments((prev) =>
                prev.map((a) =>
                  a.id === row.original.id
                    ? { ...a, ece_special_instructions: v }
                    : a
                )
              );
            }}
          />
        ),
        size: 220,
      },
      {
        id: 'ece_payroll_notes',
        header: 'ECE - Payroll Notes',
        accessorKey: 'ece_payroll_notes',
        cell: ({ row }) => (
          <EditableTextField
            value={row.original.ece_payroll_notes ?? ''}
            onCommit={(v) => {
              firebase
                .firestore()
                .collection('assignments')
                .doc(row.original.id)
                .update({ ece_payroll_notes: v })
                .catch(console.error);
              setAssignments((prev) =>
                prev.map((a) =>
                  a.id === row.original.id
                    ? { ...a, ece_payroll_notes: v }
                    : a
                )
              );
            }}
          />
        ),
        size: 220,
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
        data={enrichedAssignments}
        columns={columns}
        loading={loading || listLoading}
        getRowId={(r) => r.id}
        searchPlaceholder="Search assignments by name, UFID, course…"
        tableId="assignments"
        initialSorting={[{ id: 'date', desc: true }]}
        exportFilename="assignments.csv"
        toolbarRight={
          <Tooltip title="Export Excel (.xlsx)">
            <IconButton
              size="small"
              onClick={handleExportExcel}
              sx={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#6B7280',
                '&:hover': { backgroundColor: '#F9FAFB' },
              }}
              aria-label="Export Excel"
            >
              <TableViewOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        }
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
              icon={<EmailOutlinedIcon sx={{ fontSize: 16 }} />}
              label="Send notification email"
              onClick={() =>
                setEmailRow(assignments.find((a) => a.id === row.id) ?? null)
              }
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
          <Button
            variant="contained"
            size="small"
            onClick={() => editViewRef.current?.save()}
            sx={{
              mr: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13,
              backgroundColor: '#0021A5',
              '&:hover': { backgroundColor: '#001A85' },
            }}
          >
            Save edits
          </Button>
          <IconButton size="small" onClick={() => setEditId(null)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editId && <AssignView ref={editViewRef} uid={editId} />}
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

      <ConfirmDialog
        open={Boolean(emailRow)}
        title="Send notification email"
        description={
          emailRow
            ? `Send the assignment notification email to ${
                emailRow.name ?? emailRow.email ?? 'this student'
              }?`
            : ''
        }
        confirmLabel="Send email"
        onCancel={() => setEmailRow(null)}
        onConfirm={handleConfirmEmail}
        loading={emailSending}
      />
    </Box>
  );
}
