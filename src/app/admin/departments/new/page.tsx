'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { callFunction } from '@/firebase/functions/callFunction';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'ok'; deptCreated: boolean; inviteSent: boolean; deptId: string }
  | { kind: 'error'; message: string; deptCreated?: boolean; deptId?: string };

const CODE_PATTERN = /^[A-Z]{2,6}$/;

export default function NewDepartmentPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });

  if (userLoading) return <div>Loading…</div>;
  if (!user.superAdmin) {
    return (
      <HeaderCard title="New Department">
        <Typography>Forbidden — super admin only.</Typography>
      </HeaderCard>
    );
  }

  const codeValid = CODE_PATTERN.test(code);
  const nameValid = name.trim().length > 0;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail);
  const formValid = codeValid && nameValid && emailValid;

  const resend = async () => {
    if (submitState.kind !== 'error' || !submitState.deptId) return;
    setSubmitState({ kind: 'submitting' });
    try {
      await callFunction('createPendingMembership', {
        email: adminEmail,
        deptId: submitState.deptId,
        role: 'admin',
      });
      setSubmitState({
        kind: 'ok',
        deptCreated: false,
        inviteSent: true,
        deptId: submitState.deptId,
      });
    } catch (err: any) {
      setSubmitState({
        kind: 'error',
        message: err?.message ?? 'Resend failed',
        deptCreated: true,
        deptId: submitState.deptId,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    setSubmitState({ kind: 'submitting' });

    let deptId = '';
    // Step 1 — create the department.
    try {
      const res = (await callFunction('createDepartment', {
        code: code.toUpperCase(),
        name: name.trim(),
      })) as { id: string };
      deptId = res.id;
    } catch (err: any) {
      setSubmitState({
        kind: 'error',
        message: err?.message ?? 'Failed to create department',
      });
      return;
    }

    // Step 2 — invite the first admin. If this fails, the dept still exists.
    try {
      await callFunction('createPendingMembership', {
        email: adminEmail,
        deptId,
        role: 'admin',
      });
      setSubmitState({
        kind: 'ok',
        deptCreated: true,
        inviteSent: true,
        deptId,
      });
    } catch (err: any) {
      setSubmitState({
        kind: 'error',
        message: `Department ${deptId} was created, but the invite failed: ${
          err?.message ?? 'unknown error'
        }`,
        deptCreated: true,
        deptId,
      });
    }
  };

  return (
    <HeaderCard title="New Department">
      <Card variant="outlined" sx={{ maxWidth: 560 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Creates a new department and sends an invite to the first admin. The
            admin will be granted access the first time they sign in with this
            email.
          </Typography>

          {submitState.kind === 'ok' && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {submitState.deptCreated
                ? 'Department created and admin invited.'
                : 'Invite resent.'}{' '}
              <Link href={`/admin/departments/${submitState.deptId}`}>
                View department
              </Link>
              .
            </Alert>
          )}

          {submitState.kind === 'error' && (
            <Alert
              severity={submitState.deptCreated ? 'warning' : 'error'}
              sx={{ mb: 3 }}
              action={
                submitState.deptCreated && submitState.deptId ? (
                  <Button color="inherit" size="small" onClick={resend}>
                    Resend
                  </Button>
                ) : undefined
              }
            >
              {submitState.message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Department code"
                helperText="Uppercase A–Z, 2–6 characters (e.g. ECE)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                error={code.length > 0 && !codeValid}
                required
                inputProps={{ maxLength: 6 }}
              />
              <TextField
                label="Full name"
                helperText="E.g. Electrical and Computer Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={name.length > 0 && !nameValid}
                required
              />
              <TextField
                label="First admin email"
                helperText="The admin receives an email; access is granted on their first sign-in."
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                error={adminEmail.length > 0 && !emailValid}
                required
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={() => router.push('/admin/departments')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!formValid || submitState.kind === 'submitting'}
                >
                  {submitState.kind === 'submitting'
                    ? 'Creating…'
                    : 'Create department'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </HeaderCard>
  );
}
