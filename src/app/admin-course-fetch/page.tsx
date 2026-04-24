'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Toaster, toast } from 'react-hot-toast';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import HistoryIcon from '@mui/icons-material/History';
import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import PageLayout from '@/components/PageLayout/PageLayout';
import { getNavItems } from '@/hooks/useGetItems';
import { useCourseFetchApi } from '@/hooks/useCourseFetch';
import type { CourseFetchConfig } from '@/types/courseFetch';
import { toDateOrNull } from '@/types/courseFetch';
import ConfigForm from './ConfigForm';
import RunHistoryDialog from './RunHistoryDialog';

function statusChip(config: CourseFetchConfig) {
  const status = config.lastStatus ?? 'idle';
  const color: 'default' | 'success' | 'warning' | 'error' | 'info' =
    status === 'success'
      ? 'success'
      : status === 'partial_success'
      ? 'warning'
      : status === 'failed'
      ? 'error'
      : status === 'running'
      ? 'info'
      : 'default';
  return <Chip size="small" label={status} color={color} />;
}

export default function AdminCourseFetchPage() {
  const { user } = useAuth();
  const [role, roleLoading] = GetUserRole(user?.uid);

  const api = useCourseFetchApi();
  const [configs, setConfigs] = React.useState<CourseFetchConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CourseFetchConfig | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [historyId, setHistoryId] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.list();
      setConfigs(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load configs');
    } finally {
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    if (role === 'admin') reload();
  }, [role, reload]);

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const handleEdit = (c: CourseFetchConfig) => {
    setEditing(c);
    setFormOpen(true);
  };
  const handleDelete = async (c: CourseFetchConfig) => {
    if (!window.confirm(`Delete "${c.label}"? Runs will also be removed.`))
      return;
    try {
      await api.remove(c.id);
      toast.success('Config deleted');
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const handleToggle = async (c: CourseFetchConfig, enabled: boolean) => {
    try {
      await api.update({ ...c, enabled });
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const handleTrigger = async (c: CourseFetchConfig) => {
    setRunningId(c.id);
    const toastId = toast.loading(`Running ${c.label}…`);
    try {
      const res = await api.trigger(c.id);
      toast.dismiss(toastId);
      if (res.status === 'success') {
        toast.success(
          `Done: ${res.courseCount} courses / ${res.sectionCount} sections`
        );
      } else if (res.status === 'partial_success') {
        toast(
          `Partial: ${res.courseCount} courses, ${res.errors.length} errors`,
          {
            icon: '⚠️',
          }
        );
      } else {
        toast.error(res.errors[0] ?? 'Run failed');
      }
      reload();
    } catch (e) {
      toast.dismiss(toastId);
      toast.error(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setRunningId(null);
    }
  };

  const handleSubmit = async (
    draft: Omit<
      CourseFetchConfig,
      'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
    >
  ) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.update({ ...draft, id: editing.id });
        toast.success('Config updated');
      } else {
        await api.create(draft);
        toast.success('Config created');
      }
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (e) {
      // Leave the dialog open so the user can correct validation errors.
      toast.error(e instanceof Error ? e.message : 'Save failed');
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  if (roleLoading) return <div>Loading…</div>;
  if (role !== 'admin') return <div>Forbidden</div>;

  return (
    <PageLayout mainTitle="Course Fetch" navItems={getNavItems(role)}>
      <Toaster />
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Button variant="contained" onClick={handleCreate}>
          New config
        </Button>
        <Button variant="outlined" onClick={reload} disabled={loading}>
          Refresh
        </Button>
        {loading && <CircularProgress size={20} />}
      </Stack>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Label</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Term</TableCell>
              <TableCell>Filters</TableCell>
              <TableCell>Refresh</TableCell>
              <TableCell>Enabled</TableCell>
              <TableCell>Last run</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configs.map((c) => {
              const lastSuccess = toDateOrNull(c.lastSuccessAt ?? null);
              const lastAttempt = toDateOrNull(c.lastAttemptAt ?? null);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Stack>
                      <Typography>{c.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.id}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{c.provider}</TableCell>
                  <TableCell>
                    {c.term} {c.year}
                    {c.termCode ? ` (${c.termCode})` : ''}
                  </TableCell>
                  <TableCell>
                    <Stack>
                      <Typography variant="body2">
                        {c.departments.length > 0
                          ? c.departments.join(', ')
                          : '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.codePrefixes.length > 0
                          ? c.codePrefixes.join(', ')
                          : '—'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {c.refresh.mode}
                    {c.refresh.mode === 'everyNHours' && c.refresh.everyHours
                      ? ` (${c.refresh.everyHours}h)`
                      : ''}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={!!c.enabled}
                      onChange={(e) => handleToggle(c, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      {statusChip(c)}
                      <Typography variant="caption" color="text.secondary">
                        {lastSuccess
                          ? `ok ${lastSuccess.toLocaleString()}`
                          : lastAttempt
                          ? `tried ${lastAttempt.toLocaleString()}`
                          : '—'}
                      </Typography>
                      {c.lastError && (
                        <Typography variant="caption" color="error">
                          {c.lastError.slice(0, 80)}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      disabled={runningId === c.id}
                      onClick={() => handleTrigger(c)}
                      title="Run now"
                    >
                      {runningId === c.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <PlayArrowIcon fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setHistoryId(c.id)}
                      title="History"
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(c)}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(c)}
                      title="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && configs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary">
                    No configs yet. Click &quot;New config&quot; to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <ConfigForm
        open={formOpen}
        initial={editing}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <RunHistoryDialog
        open={!!historyId}
        configId={historyId}
        onClose={() => setHistoryId(null)}
        load={api.listRuns}
      />
    </PageLayout>
  );
}
