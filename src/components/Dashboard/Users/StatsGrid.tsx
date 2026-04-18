'use client';

import * as React from 'react';
import { Alert, Box } from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';

import { useDeleteFacultyStat, useFacultyStats } from '@/hooks/useFacultyStats';
import { FacultyStats } from '@/types/User';

import {
  AdminDataTable,
  ConfirmDialog,
  RowActionButton,
  StatusPill,
  type StatusTone,
} from '@/components/common/AdminDataTable';

interface UserGridProps {
  userRole: string;
}

function levelTone(level?: string): StatusTone {
  const v = (level || '').toLowerCase();
  if (v.includes('high')) return 'success';
  if (v.includes('medium')) return 'warning';
  if (v.includes('low')) return 'neutral';
  return 'info';
}

export default function StatsGrid({ userRole }: UserGridProps) {
  const { data, isLoading, error } = useFacultyStats();
  const deleteMutation = useDeleteFacultyStat();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
    } catch (err) {
      console.error('Error deleting faculty stat:', err);
    } finally {
      setDeleteId(null);
    }
  };

  const columns = React.useMemo<ColumnDef<FacultyStats, any>[]>(
    () => [
      {
        id: 'instructor',
        header: 'Instructor',
        accessorKey: 'instructor',
        cell: ({ getValue }) => (
          <Box sx={{ fontWeight: 500, color: '#111827' }}>
            {(getValue() as string) || '—'}
          </Box>
        ),
        size: 200,
      },
      {
        id: 'research_level',
        header: 'Research Activity',
        accessorKey: 'research_level',
        cell: ({ getValue }) => {
          const v = getValue() as string | undefined;
          if (!v) return <span style={{ color: '#9CA3AF' }}>—</span>;
          return <StatusPill label={v} tone={levelTone(v)} />;
        },
        size: 200,
      },
      {
        id: 'teaching_load',
        header: 'Teaching Load',
        accessorKey: 'teaching_load',
        cell: ({ getValue }) => {
          const v = getValue() as string | undefined;
          return v || <span style={{ color: '#9CA3AF' }}>—</span>;
        },
        size: 200,
      },
    ],
    []
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: '8px' }}>
        Error loading faculty stats.
      </Alert>
    );
  }

  return (
    <Box>
      <AdminDataTable
        data={data ?? []}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id ?? r.instructor}
        searchPlaceholder="Search faculty…"
        tableId={`faculty-stats-${userRole}`}
        exportFilename="faculty-stats.csv"
        rowActions={(row) => (
          <>
            <RowActionButton
              variant="icon"
              icon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
              label="Open details"
              tone="brand"
              onClick={() => {
                const href = `/faculty/${row.id ?? row.instructor}`;
                window.location.assign(href);
              }}
            />
            <RowActionButton
              variant="icon"
              icon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
              label="Delete"
              onClick={() => setDeleteId((row.id ?? row.instructor) as string)}
            />
          </>
        )}
        emptyState={{
          title: 'No faculty stats',
          description:
            'Faculty teaching load and research activity metrics will appear here once recorded.',
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete faculty record"
        description="This removes the instructor's record from the stats dashboard."
        confirmLabel="Delete record"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
