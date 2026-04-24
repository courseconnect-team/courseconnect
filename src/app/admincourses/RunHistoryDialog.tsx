'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { CourseFetchRun, toDateOrNull } from '@/types/courseFetch';

export interface RunHistoryDialogProps {
  open: boolean;
  configId: string | null;
  onClose: () => void;
  load: (configId: string) => Promise<CourseFetchRun[]>;
}

function statusColor(
  status: string
): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'success') return 'success';
  if (status === 'partial_success') return 'warning';
  if (status === 'failed') return 'error';
  return 'default';
}

export default function RunHistoryDialog({
  open,
  configId,
  onClose,
  load,
}: RunHistoryDialogProps) {
  const [runs, setRuns] = React.useState<CourseFetchRun[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !configId) return;
    setLoading(true);
    setError(null);
    load(configId)
      .then(setRuns)
      .catch((e) => setError(e instanceof Error ? e.message : 'Load failed'))
      .finally(() => setLoading(false));
  }, [open, configId, load]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Run history</DialogTitle>
      <DialogContent>
        {loading && <LinearProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && runs.length === 0 && (
          <Typography color="text.secondary">No runs yet.</Typography>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          {runs.map((r) => {
            const started = toDateOrNull(r.startedAt);
            const finished = toDateOrNull(r.finishedAt ?? null);
            return (
              <Stack
                key={r.runId}
                spacing={0.5}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Chip
                    size="small"
                    label={r.status}
                    color={statusColor(r.status)}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {started?.toLocaleString() ?? '—'}
                    {finished ? ` → ${finished.toLocaleString()}` : ''}
                  </Typography>
                </Stack>
                <Typography variant="body2">
                  raw: {r.rawCount} · courses: {r.courseCount} · sections:{' '}
                  {r.sectionCount} · {r.durationMs ?? '—'}ms · {r.triggeredBy}
                </Typography>
                {r.errors && r.errors.length > 0 && (
                  <Typography variant="body2" color="error">
                    {r.errors.slice(0, 3).join(' · ')}
                  </Typography>
                )}
                {r.warnings && r.warnings.length > 0 && (
                  <Typography variant="body2" color="warning.main">
                    {r.warnings.slice(0, 3).join(' · ')}
                  </Typography>
                )}
              </Stack>
            );
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
