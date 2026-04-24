'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDepartments, findDepartmentById } from '@/hooks/useDepartments';
import { callFunction } from '@/firebase/functions/callFunction';
import { MembersManager } from '@/components/Departments/MembersManager';

export default function DepartmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const { departments, loading: deptsLoading } = useDepartments({
    include: 'all',
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    kind: 'ok' | 'error';
    message: string;
  } | null>(null);

  if (userLoading || deptsLoading) {
    return (
      <HeaderCard title="Department">
        <Typography>Loading…</Typography>
      </HeaderCard>
    );
  }

  if (!user.superAdmin) {
    return (
      <HeaderCard title="Department">
        <Typography>Forbidden — super admin only.</Typography>
      </HeaderCard>
    );
  }

  const deptId = params?.id ?? '';
  const dept = findDepartmentById(departments, deptId);

  if (!dept) {
    return (
      <HeaderCard title="Department">
        <Alert severity="warning">
          Department <code>{deptId}</code> not found.{' '}
          <Link href="/admin/departments">Back to list</Link>.
        </Alert>
      </HeaderCard>
    );
  }

  const handleArchive = async () => {
    if (
      !window.confirm(`Archive ${dept.code}? Active admins lose admin nav.`)
    ) {
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await callFunction('archiveDepartment', { id: dept.id });
      setNotice({ kind: 'ok', message: `${dept.code} archived.` });
    } catch (err: any) {
      setNotice({
        kind: 'error',
        message: err?.message ?? 'Archive failed.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleUnarchive = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await callFunction('unarchiveDepartment', { id: dept.id });
      setNotice({ kind: 'ok', message: `${dept.code} restored.` });
    } catch (err: any) {
      setNotice({
        kind: 'error',
        message: err?.message ?? 'Unarchive failed.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <HeaderCard title={`Department: ${dept.code}`}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Chip
          label={dept.status === 'archived' ? 'Archived' : 'Active'}
          size="small"
          color={dept.status === 'archived' ? 'default' : 'success'}
          variant="outlined"
        />
        <Typography variant="body2" color="text.secondary">
          id: {dept.id}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {dept.status === 'archived' ? (
          <Button variant="outlined" disabled={busy} onClick={handleUnarchive}>
            Unarchive
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="warning"
            disabled={busy}
            onClick={handleArchive}
          >
            Archive
          </Button>
        )}
        <Button onClick={() => router.push('/admin/departments')}>Back</Button>
      </Stack>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {dept.name}
      </Typography>

      {notice && (
        <Alert
          severity={notice.kind === 'ok' ? 'success' : 'error'}
          sx={{ mb: 3 }}
        >
          {notice.message}
        </Alert>
      )}

      <Card variant="outlined">
        <CardContent>
          <MembersManager
            deptId={dept.id}
            deptArchived={dept.status === 'archived'}
          />
        </CardContent>
      </Card>

      <Divider sx={{ my: 4 }} />

      <Typography variant="caption" color="text.secondary">
        Course, application, and announcement data for {dept.code} are available
        via the regular admin surfaces under your super-admin identity.
      </Typography>
    </HeaderCard>
  );
}
