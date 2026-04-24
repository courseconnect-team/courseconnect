'use client';

import React, { useEffect, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { callFunction } from '@/firebase/functions/callFunction';

type MemberEntry = {
  uid: string;
  role: 'admin' | 'faculty';
  displayEmail: string | null;
  displayName: string | null;
};

type PendingEntry = {
  email: string;
  role: 'admin' | 'faculty';
  invitedBy: string | null;
  invitedByName: string | null;
};

// Subscribe to users whose roles[] contains this department.
// This runs a collection-group-free query on users filtering by
// departmentIds array-contains deptId.
function useMembers(deptId: string): {
  members: MemberEntry[];
  loading: boolean;
  error: Error | null;
} {
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = firebase
      .firestore()
      .collection('users')
      .where('departmentIds', 'array-contains', deptId)
      .onSnapshot(
        (snap) => {
          const out: MemberEntry[] = [];
          for (const doc of snap.docs) {
            const data = doc.data() as any;
            const roles = Array.isArray(data.roles) ? data.roles : [];
            for (const r of roles) {
              if (
                r &&
                typeof r === 'object' &&
                r.deptId === deptId &&
                (r.role === 'admin' || r.role === 'faculty')
              ) {
                out.push({
                  uid: doc.id,
                  role: r.role,
                  displayEmail:
                    typeof data.email === 'string' ? data.email : null,
                  displayName:
                    [data.firstname, data.lastname]
                      .filter((v) => typeof v === 'string' && v.trim())
                      .join(' ') || null,
                });
              }
            }
          }
          // admins first, then faculty, then alpha
          out.sort((a, b) => {
            if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
            return (a.displayEmail ?? a.uid).localeCompare(
              b.displayEmail ?? b.uid
            );
          });
          setMembers(out);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );
    return () => unsub();
  }, [deptId]);

  return { members, loading, error };
}

function usePendingInvites(deptId: string): {
  pending: PendingEntry[];
  loading: boolean;
  error: Error | null;
} {
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = firebase
      .firestore()
      .collection('pendingMemberships')
      .where('deptId', '==', deptId)
      .onSnapshot(
        (snap) => {
          setPending(
            snap.docs.map((doc) => {
              const d = doc.data() as any;
              return {
                email: doc.id,
                role: d.role === 'admin' ? 'admin' : 'faculty',
                invitedBy: typeof d.invitedBy === 'string' ? d.invitedBy : null,
                invitedByName:
                  typeof d.invitedByName === 'string' ? d.invitedByName : null,
              };
            })
          );
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );
    return () => unsub();
  }, [deptId]);

  return { pending, loading, error };
}

export function MembersManager({
  deptId,
  deptArchived,
}: {
  deptId: string;
  deptArchived: boolean;
}) {
  const { members } = useMembers(deptId);
  const { pending } = usePendingInvites(deptId);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'faculty'>('faculty');
  const [notice, setNotice] = useState<{
    kind: 'ok' | 'error';
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setNotice({ kind: 'error', message: 'Enter a valid email.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await callFunction('createPendingMembership', {
        email: inviteEmail,
        deptId,
        role: inviteRole,
      });
      setInviteEmail('');
      setNotice({
        kind: 'ok',
        message: `Invited ${inviteEmail} as ${inviteRole}.`,
      });
    } catch (err: any) {
      setNotice({
        kind: 'error',
        message: err?.message ?? 'Failed to invite.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRevokePending = async (email: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await callFunction('revokePendingMembership', { email });
      setNotice({ kind: 'ok', message: `Invite for ${email} revoked.` });
    } catch (err: any) {
      setNotice({
        kind: 'error',
        message: err?.message ?? 'Failed to revoke.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeMember = async (uid: string, role: 'admin' | 'faculty') => {
    if (
      !window.confirm(
        `Remove this user's ${role} role in ${deptId}? They keep their account.`
      )
    ) {
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await callFunction('revokeRole', { uid, deptId, role });
      setNotice({ kind: 'ok', message: `Removed ${role} role.` });
    } catch (err: any) {
      setNotice({
        kind: 'error',
        message: err?.message ?? 'Failed to revoke.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Members
      </Typography>

      {notice && (
        <Alert
          severity={notice.kind === 'ok' ? 'success' : 'error'}
          sx={{ mb: 2 }}
        >
          {notice.message}
        </Alert>
      )}

      {!deptArchived && (
        <Box sx={{ mb: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems="flex-start"
          >
            <TextField
              label="Invite email"
              size="small"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 240 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as 'admin' | 'faculty')
                }
              >
                <MenuItem value="faculty">Faculty</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" disabled={busy} onClick={handleInvite}>
              Invite
            </Button>
          </Stack>
        </Box>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
        Pending invites
      </Typography>
      {pending.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No pending invites.
        </Typography>
      ) : (
        <List dense>
          {pending.map((p) => (
            <ListItem
              key={p.email}
              secondaryAction={
                <Button
                  size="small"
                  color="error"
                  disabled={busy}
                  onClick={() => handleRevokePending(p.email)}
                >
                  Revoke
                </Button>
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{p.email}</span>
                    <Chip
                      size="small"
                      label={p.role}
                      color={p.role === 'admin' ? 'primary' : 'default'}
                    />
                  </Stack>
                }
                secondary={
                  p.invitedByName ? `Invited by ${p.invitedByName}` : null
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" color="text.secondary">
        Active members
      </Typography>
      {members.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No members yet.
        </Typography>
      ) : (
        <List dense>
          {members.map((m) => (
            <ListItem
              key={`${m.uid}:${m.role}`}
              secondaryAction={
                <Button
                  size="small"
                  color="error"
                  disabled={busy}
                  onClick={() => handleRevokeMember(m.uid, m.role)}
                >
                  Remove
                </Button>
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{m.displayName ?? m.displayEmail ?? m.uid}</span>
                    <Chip
                      size="small"
                      label={m.role}
                      color={m.role === 'admin' ? 'primary' : 'default'}
                    />
                  </Stack>
                }
                secondary={m.displayEmail}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
