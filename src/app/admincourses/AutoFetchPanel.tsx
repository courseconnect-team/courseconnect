'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import HistoryIcon from '@mui/icons-material/History';
import EastRoundedIcon from '@mui/icons-material/EastRounded';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { toast } from 'react-hot-toast';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { useCourseFetchApi } from '@/hooks/useCourseFetch';
import type {
  CourseFetchConfig,
  CourseFetchPhase,
  CoursePreview,
} from '@/types/courseFetch';
import { toDateOrNull } from '@/types/courseFetch';
import ConfigForm, { semesterNameFromTermYear } from './ConfigForm';
import RunHistoryDialog from './RunHistoryDialog';
import PreviewDialog from './PreviewDialog';

const PURPLE = '#562EBA';

// --- small presentational helpers ---

function relativeTime(date: Date | null): string {
  if (!date) return 'never';
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function statusColor(status?: string): {
  color: 'default' | 'success' | 'warning' | 'error' | 'info';
  label: string;
} {
  switch (status) {
    case 'success':
      return { color: 'success', label: 'ok' };
    case 'partial_success':
      return { color: 'warning', label: 'partial' };
    case 'failed':
      return { color: 'error', label: 'failed' };
    case 'running':
      return { color: 'info', label: 'running' };
    default:
      return { color: 'default', label: 'idle' };
  }
}

function refreshLabel(refresh: CourseFetchConfig['refresh']): string {
  switch (refresh.mode) {
    case 'manual':
      return 'Manual';
    case 'hourly':
      return 'Hourly';
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'everyNHours':
      return `Every ${refresh.everyHours ?? '?'}h`;
  }
}

function filterSummary(c: CourseFetchConfig): string {
  const parts: string[] = [];
  if (c.codePrefixes.length > 0) parts.push(c.codePrefixes.join(', '));
  if (c.numberMin != null || c.numberMax != null) {
    parts.push(`${c.numberMin ?? 0}–${c.numberMax ?? 9999}`);
  }
  if (c.level && c.level !== 'any') parts.push(c.level);
  if (c.campus && c.campus !== 'any') parts.push(c.campus);
  return parts.length > 0 ? parts.join(' · ') : 'All courses';
}

// --- Workflow step cell ---

function StepCell(props: {
  icon: React.ReactNode;
  title: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <Stack
      spacing={0.5}
      sx={{
        flex: 1,
        minWidth: 0,
        py: 1.25,
        px: 1.5,
        borderRadius: 2,
        bgcolor: props.muted ? 'grey.50' : 'rgba(86,46,186,0.04)',
        border: '1px solid',
        borderColor: props.muted ? 'divider' : 'rgba(86,46,186,0.15)',
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Box
          sx={{
            color: props.muted ? 'text.secondary' : PURPLE,
            display: 'flex',
          }}
        >
          {props.icon}
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {props.title}
        </Typography>
      </Stack>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: 14,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={props.value}
      >
        {props.value}
      </Typography>
    </Stack>
  );
}

function Arrow() {
  return (
    <Box
      sx={{
        color: 'text.disabled',
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        px: 0.5,
      }}
    >
      <EastRoundedIcon fontSize="small" />
    </Box>
  );
}

// --- Config card ---

interface ActiveRunState {
  runId: string;
  phase?: CourseFetchPhase;
  cancelling?: boolean;
  triggeredBy?: 'manual' | 'scheduled';
}

function ConfigCard(props: {
  config: CourseFetchConfig;
  currentSemester: string;
  activeRun: ActiveRunState | null;
  previewing: boolean;
  onToggle: (enabled: boolean) => void;
  onPreview: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onHistory: () => void;
}) {
  const { config: c } = props;
  const status = statusColor(c.lastStatus);
  const lastAttempt = toDateOrNull(c.lastAttemptAt ?? null);
  const lastSuccess = toDateOrNull(c.lastSuccessAt ?? null);
  const shownTime = lastSuccess ?? lastAttempt;
  const semesterLabel = semesterNameFromTermYear(c.term, c.year);
  const isCurrent = semesterLabel === props.currentSemester;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'box-shadow 150ms, border-color 150ms',
        '&:hover': {
          boxShadow: '0px 6px 24px rgba(86,46,186,0.08)',
          borderColor: 'rgba(86,46,186,0.3)',
        },
      }}
    >
      {/* Header row */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: 2.5,
          py: 1.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fafafa',
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor:
              status.color === 'success'
                ? 'success.main'
                : status.color === 'error'
                ? 'error.main'
                : status.color === 'warning'
                ? 'warning.main'
                : status.color === 'info'
                ? 'info.main'
                : 'grey.400',
          }}
        />
        <Typography sx={{ fontWeight: 700, fontSize: 16, flex: 1 }}>
          {c.label}
        </Typography>
        {!c.enabled && (
          <Chip size="small" label="Disabled" variant="outlined" />
        )}
        <Chip size="small" color={status.color} label={status.label} />
        <Tooltip title={c.enabled ? 'Disable' : 'Enable'}>
          <Switch
            size="small"
            checked={c.enabled}
            onChange={(e) => props.onToggle(e.target.checked)}
          />
        </Tooltip>
      </Stack>

      {/* Workflow pipeline */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 1, md: 0 }}
        alignItems="stretch"
        sx={{ px: 2.5, py: 2 }}
      >
        <StepCell
          icon={<SchoolOutlinedIcon fontSize="small" />}
          title="Source"
          value={c.provider}
        />
        <Arrow />
        <StepCell
          icon={<FilterAltOutlinedIcon fontSize="small" />}
          title="Filter"
          value={filterSummary(c)}
        />
        <Arrow />
        <StepCell
          icon={<ScheduleOutlinedIcon fontSize="small" />}
          title="Schedule"
          value={refreshLabel(c.refresh)}
        />
        <Arrow />
        <StepCell
          icon={<CalendarMonthOutlinedIcon fontSize="small" />}
          title="Target"
          value={isCurrent ? `${semesterLabel} (current)` : semesterLabel}
          muted={!isCurrent}
        />
      </Stack>

      {/* Footer row */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fafafa',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {shownTime ? (
            <>
              Last run <strong>{relativeTime(shownTime)}</strong>
              {c.lastError ? ` · ${c.lastError.slice(0, 60)}` : ''}
            </>
          ) : (
            'Never run'
          )}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {props.activeRun ? (
            <>
              <Chip
                size="small"
                icon={<CircularProgress size={12} thickness={5} />}
                label={
                  props.activeRun.phase === 'writing' ? 'Writing…' : 'Fetching…'
                }
                sx={{
                  bgcolor: 'rgba(86,46,186,0.08)',
                  color: PURPLE,
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: PURPLE, ml: '6px' },
                }}
              />
              {props.activeRun.triggeredBy === 'scheduled' && (
                <Chip
                  size="small"
                  label="scheduled"
                  variant="outlined"
                  sx={{ borderColor: 'divider', color: 'text.secondary' }}
                />
              )}
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={
                  props.activeRun.cancelling ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <StopCircleOutlinedIcon fontSize="small" />
                  )
                }
                disabled={props.activeRun.cancelling}
                onClick={props.onCancel}
                sx={{ textTransform: 'none' }}
              >
                {props.activeRun.cancelling ? 'Cancelling…' : 'Cancel run'}
              </Button>
            </>
          ) : (
            <Button
              size="small"
              variant="contained"
              disableElevation
              startIcon={
                props.previewing ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )
              }
              disabled={props.previewing}
              onClick={props.onPreview}
              sx={{
                textTransform: 'none',
                bgcolor: PURPLE,
                '&:hover': { bgcolor: '#4524a0' },
              }}
            >
              Run…
            </Button>
          )}
          <IconButton size="small" onClick={props.onHistory} title="History">
            <HistoryIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={props.onEdit}
            title="Edit"
            disabled={!!props.activeRun}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={props.onDelete}
            title="Delete"
            disabled={!!props.activeRun}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
}

// --- Panel ---

export interface AutoFetchPanelProps {
  currentSemester: string;
}

export default function AutoFetchPanel({
  currentSemester,
}: AutoFetchPanelProps) {
  const api = useCourseFetchApi();
  const [configs, setConfigs] = React.useState<CourseFetchConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CourseFetchConfig | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [activeRuns, setActiveRuns] = React.useState<
    Record<string, ActiveRunState>
  >({});
  const [historyId, setHistoryId] = React.useState<string | null>(null);
  const [previewConfig, setPreviewConfig] =
    React.useState<CourseFetchConfig | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [previewData, setPreviewData] = React.useState<CoursePreview | null>(
    null
  );

  // Track which runIds have already emitted a terminal toast so re-fires of
  // the same terminal snapshot (or stale historical runs loaded at mount)
  // don't spam the admin.
  const toastedRunIdsRef = React.useRef<Set<string>>(new Set());
  // Per-runId cleanup functions for run-doc subscriptions. Keyed by runId so
  // a new run on the same config can coexist with a terminal-cleanup race.
  const runSubsRef = React.useRef<Map<string, () => void>>(new Map());

  // Manual reload kept for the Refresh button; the collection snapshot below
  // also keeps configs live, so this is primarily for explicit user action.
  const reload = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await api.list();
      setConfigs(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load workflows';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Live listener on the configs collection — picks up cron-initiated runs,
  // live status transitions, and the `lastRunId` bump on Apply without
  // requiring a manual refresh.
  React.useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection('courseFetchConfigs')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .onSnapshot(
        (snap) => {
          const list: CourseFetchConfig[] = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as CourseFetchConfig)
          );
          setConfigs(list);
          setLoading(false);
          setLoadError(null);
        },
        (err) => {
          console.error('courseFetchConfigs listener error:', err);
          setLoadError(err.message);
          setLoading(false);
        }
      );
    return () => unsub();
  }, []);

  // For each config with an un-toasted runId, attach a run-doc listener that
  // streams `phase` while running and fires a terminal toast exactly once.
  // Historical terminal runs (configs loaded at mount where lastStatus is
  // not 'running') are added to toastedRunIdsRef so we never retroactively
  // toast them.
  React.useEffect(() => {
    for (const c of configs) {
      const runId = c.lastRunId;
      if (!runId) continue;
      if (c.lastStatus !== 'running') {
        toastedRunIdsRef.current.add(runId);
        continue;
      }
      if (toastedRunIdsRef.current.has(runId)) continue;
      if (runSubsRef.current.has(runId)) continue;

      const configId = c.id;
      const label = c.label;
      const ref = firebase
        .firestore()
        .collection('courseFetchConfigs')
        .doc(configId)
        .collection('runs')
        .doc(runId);
      const unsub = ref.onSnapshot(
        (snap) => {
          if (!snap.exists) return;
          const data = snap.data() as Record<string, unknown>;
          const status = String(data.status ?? '');
          if (status === 'running') {
            setActiveRuns((prev) => ({
              ...prev,
              [configId]: {
                runId,
                phase:
                  (data.phase as CourseFetchPhase | undefined) ?? 'fetching',
                cancelling:
                  prev[configId]?.cancelling || data.cancelRequested === true,
                triggeredBy:
                  (data.triggeredBy as 'manual' | 'scheduled' | undefined) ??
                  'manual',
              },
            }));
            return;
          }
          // Terminal transition — remove active run, toast once, self-destroy.
          setActiveRuns((prev) => {
            const existing = prev[configId];
            if (!existing || existing.runId !== runId) return prev;
            const { [configId]: _drop, ...rest } = prev;
            return rest;
          });
          if (!toastedRunIdsRef.current.has(runId)) {
            toastedRunIdsRef.current.add(runId);
            const courseCount = Number(data.courseCount ?? 0);
            const sectionCount = Number(data.sectionCount ?? 0);
            const errors = Array.isArray(data.errors)
              ? (data.errors as unknown[]).filter(
                  (e): e is string => typeof e === 'string'
                )
              : [];
            if (status === 'success') {
              toast.success(
                `${label}: ${courseCount} course${
                  courseCount === 1 ? '' : 's'
                } · ${sectionCount} section${sectionCount === 1 ? '' : 's'}`
              );
            } else if (status === 'partial_success') {
              toast(
                `${label}: partial — ${courseCount} courses, ${
                  errors.length
                } error${errors.length === 1 ? '' : 's'}`,
                { icon: '⚠️' }
              );
            } else if (status === 'cancelled') {
              toast(
                `${label}: cancelled — ${courseCount} course${
                  courseCount === 1 ? '' : 's'
                } written`,
                { icon: '⏹️' }
              );
            } else {
              toast.error(`${label}: ${errors[0] ?? 'Run failed'}`);
            }
          }
          const u = runSubsRef.current.get(runId);
          if (u) {
            u();
            runSubsRef.current.delete(runId);
          }
        },
        (err) => {
          console.error(`run ${runId} listener error:`, err);
        }
      );
      runSubsRef.current.set(runId, unsub);
    }
  }, [configs]);

  // Unmount cleanup for any still-open run-doc subscriptions.
  React.useEffect(() => {
    const subs = runSubsRef.current;
    return () => {
      subs.forEach((unsub) => unsub());
      subs.clear();
    };
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const handleEdit = (c: CourseFetchConfig) => {
    setEditing(c);
    setFormOpen(true);
  };
  const handleDelete = async (c: CourseFetchConfig) => {
    if (!window.confirm(`Delete "${c.label}"? Run history will be removed.`))
      return;
    try {
      await api.remove(c.id);
      toast.success('Workflow deleted');
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
  // Fires the trigger and returns. Terminal state + toasts flow through the
  // run-doc snapshot listener above, not this promise — the Cloud Function
  // call blocks until the run completes, but we don't need that for the UI
  // since the snapshot already reflects 'running' immediately.
  const startRun = (c: CourseFetchConfig, includeCourses?: string[]) => {
    // Optimistic placeholder so the card shows "Fetching…" + disabled Cancel
    // until the snapshot fills in the real runId.
    setActiveRuns((prev) =>
      prev[c.id]
        ? prev
        : {
            ...prev,
            [c.id]: {
              runId: '',
              phase: 'fetching',
              cancelling: false,
              triggeredBy: 'manual',
            },
          }
    );
    api.trigger(c.id, includeCourses).catch((e) => {
      toast.error(e instanceof Error ? e.message : 'Run failed');
      setActiveRuns((prev) => {
        const existing = prev[c.id];
        if (!existing || existing.runId !== '') return prev;
        const { [c.id]: _drop, ...rest } = prev;
        return rest;
      });
    });
  };

  const handleCancel = async (c: CourseFetchConfig) => {
    const active = activeRuns[c.id];
    if (!active || !active.runId) return;
    setActiveRuns((prev) =>
      prev[c.id]
        ? { ...prev, [c.id]: { ...prev[c.id], cancelling: true } }
        : prev
    );
    try {
      await api.cancelRun(c.id, active.runId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Cancel failed');
      setActiveRuns((prev) =>
        prev[c.id]
          ? { ...prev, [c.id]: { ...prev[c.id], cancelling: false } }
          : prev
      );
    }
  };
  const runPreview = React.useCallback(
    async (c: CourseFetchConfig) => {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewData(null);
      try {
        const res = await api.preview(c.id);
        setPreviewData(res);
      } catch (e) {
        setPreviewError(e instanceof Error ? e.message : 'Preview failed');
      } finally {
        setPreviewLoading(false);
      }
    },
    [api]
  );

  const handlePreview = (c: CourseFetchConfig) => {
    setPreviewConfig(c);
    runPreview(c);
  };
  const handleClosePreview = () => {
    setPreviewConfig(null);
    setPreviewData(null);
    setPreviewError(null);
  };
  const handleApplyFromPreview = (selectedCodes: string[]) => {
    if (!previewConfig) return;
    const cfg = previewConfig;
    handleClosePreview();
    startRun(cfg, selectedCodes);
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
        toast.success('Workflow updated');
      } else {
        await api.create(draft);
        toast.success('Workflow created');
      }
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      {/* Intro card */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'rgba(86,46,186,0.15)',
          bgcolor: 'rgba(86,46,186,0.03)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1.5}
        >
          <Stack spacing={0.5}>
            <Typography sx={{ fontWeight: 700 }}>
              Auto-fetch workflows
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Each workflow fetches from a provider, applies your filters, and
              writes into the target semester&apos;s course list. Runs always
              start from Preview, and a running job — whether manual or
              scheduled — can be cancelled mid-flight. Manual Excel uploads are
              preserved.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={reload}
              disabled={loading}
              startIcon={<RefreshIcon fontSize="small" />}
              sx={{ textTransform: 'none' }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleCreate}
              disableElevation
              startIcon={<AddIcon fontSize="small" />}
              sx={{
                textTransform: 'none',
                bgcolor: PURPLE,
                '&:hover': { bgcolor: '#4524a0' },
              }}
            >
              New workflow
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Configs */}
      {loading && configs.length === 0 && (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      )}
      {loadError && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'error.light',
            bgcolor: 'error.50',
          }}
        >
          <Typography color="error.main" sx={{ fontWeight: 600 }}>
            Couldn&apos;t load workflows
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {loadError}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            This usually means the Cloud Functions aren&apos;t deployed yet: run{' '}
            <code>npm run deploy</code> in <code>functions/</code>.
          </Typography>
        </Paper>
      )}
      {!loading && !loadError && configs.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
            No workflows yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a workflow to auto-populate a semester&apos;s course list.
          </Typography>
          <Button
            variant="contained"
            onClick={handleCreate}
            disableElevation
            startIcon={<AddIcon />}
            sx={{
              textTransform: 'none',
              bgcolor: PURPLE,
              '&:hover': { bgcolor: '#4524a0' },
            }}
          >
            New workflow
          </Button>
        </Paper>
      )}
      <Stack spacing={2}>
        {configs.map((c) => (
          <ConfigCard
            key={c.id}
            config={c}
            currentSemester={currentSemester}
            activeRun={activeRuns[c.id] ?? null}
            previewing={previewLoading && previewConfig?.id === c.id}
            onToggle={(enabled) => handleToggle(c, enabled)}
            onPreview={() => handlePreview(c)}
            onCancel={() => handleCancel(c)}
            onEdit={() => handleEdit(c)}
            onDelete={() => handleDelete(c)}
            onHistory={() => setHistoryId(c.id)}
          />
        ))}
      </Stack>

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
      <PreviewDialog
        open={!!previewConfig}
        config={previewConfig}
        preview={previewData}
        loading={previewLoading}
        loadError={previewError}
        applying={false}
        onClose={handleClosePreview}
        onRetry={() => previewConfig && runPreview(previewConfig)}
        onApply={handleApplyFromPreview}
      />
    </Stack>
  );
}
