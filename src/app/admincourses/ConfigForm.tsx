'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  CourseFetchConfig,
  DEFAULT_COURSE_FETCH_CONFIG,
} from '@/types/courseFetch';

// Mirrors the server-side `semesterNameFromConfig` helper so admins see the
// exact semester doc id their workflow will write to.
export function semesterNameFromTermYear(
  term: 'spring' | 'summer' | 'fall',
  year: number
): string {
  const cap = term.charAt(0).toUpperCase() + term.slice(1);
  return `${cap} ${year}`;
}

type Draft = Omit<
  CourseFetchConfig,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;

export interface ConfigFormProps {
  open: boolean;
  initial?: CourseFetchConfig | null;
  onCancel: () => void;
  onSubmit: (draft: Draft) => Promise<void>;
  submitting: boolean;
}

function draftFromInitial(
  initial: CourseFetchConfig | null | undefined
): Draft {
  if (!initial) return { ...DEFAULT_COURSE_FETCH_CONFIG };
  return {
    label: initial.label,
    provider: initial.provider,
    institution: initial.institution,
    term: initial.term,
    year: initial.year,
    termCode: initial.termCode,
    codePrefixes: initial.codePrefixes ?? [],
    numberMin: initial.numberMin,
    numberMax: initial.numberMax,
    campus: initial.campus ?? 'any',
    level: initial.level ?? 'any',
    enabled: initial.enabled,
    refresh: initial.refresh ?? { mode: 'manual' },
    concurrency: initial.concurrency ?? 4,
  };
}

function joinCsv(values: string[] | undefined): string {
  return (values ?? []).join(', ');
}
function parseCsv(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((v) => v.trim().toUpperCase())
    .filter(Boolean);
}

export default function ConfigForm({
  open,
  initial,
  onCancel,
  onSubmit,
  submitting,
}: ConfigFormProps) {
  const [draft, setDraft] = React.useState<Draft>(draftFromInitial(initial));
  const [prefixesRaw, setPrefixesRaw] = React.useState(
    joinCsv(initial?.codePrefixes)
  );
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraft(draftFromInitial(initial));
    setPrefixesRaw(joinCsv(initial?.codePrefixes));
    setErr(null);
  }, [initial, open]);

  const handleSubmit = async () => {
    setErr(null);
    const payload: Draft = {
      ...draft,
      codePrefixes: parseCsv(prefixesRaw),
    };
    try {
      await onSubmit(payload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const targetSemester = semesterNameFromTermYear(draft.term, draft.year);

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>
        {initial ? 'Edit workflow' : 'New auto-fetch workflow'}
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
          This workflow will write courses into{' '}
          <Typography component="span" sx={{ fontWeight: 600 }}>
            {targetSemester}
          </Typography>
          {'. '}
          Re-runs update in place using <code>{`{code}__{classNumber}`}</code>{' '}
          doc ids so Excel uploads are never overwritten.
        </Alert>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Label"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            fullWidth
            required
          />
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Provider</InputLabel>
              <Select
                label="Provider"
                value={draft.provider}
                onChange={(e) =>
                  setDraft({ ...draft, provider: e.target.value as 'UF' })
                }
              >
                <MenuItem value="UF">UF</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Institution"
              value={draft.institution}
              onChange={(e) =>
                setDraft({ ...draft, institution: e.target.value })
              }
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Term</InputLabel>
              <Select
                label="Term"
                value={draft.term}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    term: e.target.value as 'spring' | 'summer' | 'fall',
                  })
                }
              >
                <MenuItem value="spring">Spring</MenuItem>
                <MenuItem value="summer">Summer</MenuItem>
                <MenuItem value="fall">Fall</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Year"
              type="number"
              value={draft.year}
              onChange={(e) =>
                setDraft({ ...draft, year: Number(e.target.value) })
              }
              fullWidth
              required
            />
            <TextField
              label="Term code (override)"
              value={draft.termCode ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, termCode: e.target.value || undefined })
              }
              fullWidth
            />
          </Stack>
          <TextField
            label="Course code prefixes (comma-separated)"
            helperText="UF 2–4 letter prefix on the course code. CISE: COP, CAP, CIS, CEN, CDA, CNT. ECE: EEL, EEE, EGN. Leave empty for all."
            value={prefixesRaw}
            onChange={(e) => setPrefixesRaw(e.target.value)}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Number min"
              type="number"
              value={draft.numberMin ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  numberMin:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              fullWidth
            />
            <TextField
              label="Number max"
              type="number"
              value={draft.numberMax ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  numberMax:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Campus</InputLabel>
              <Select
                label="Campus"
                value={draft.campus}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    campus: e.target.value as 'main' | 'online' | 'any',
                  })
                }
              >
                <MenuItem value="any">Any</MenuItem>
                <MenuItem value="main">Main</MenuItem>
                <MenuItem value="online">Online</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                label="Level"
                value={draft.level}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    level: e.target.value as
                      | 'undergraduate'
                      | 'graduate'
                      | 'any',
                  })
                }
              >
                <MenuItem value="any">Any</MenuItem>
                <MenuItem value="undergraduate">Undergraduate</MenuItem>
                <MenuItem value="graduate">Graduate</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Refresh</InputLabel>
              <Select
                label="Refresh"
                value={draft.refresh.mode}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    refresh: {
                      mode: e.target.value as
                        | 'manual'
                        | 'hourly'
                        | 'daily'
                        | 'weekly'
                        | 'everyNHours',
                      everyHours:
                        e.target.value === 'everyNHours'
                          ? draft.refresh.everyHours ?? 6
                          : undefined,
                    },
                  })
                }
              >
                <MenuItem value="manual">Manual only</MenuItem>
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="everyNHours">Every N hours</MenuItem>
              </Select>
            </FormControl>
            {draft.refresh.mode === 'everyNHours' && (
              <TextField
                label="Hours"
                type="number"
                value={draft.refresh.everyHours ?? 6}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    refresh: {
                      ...draft.refresh,
                      everyHours: Number(e.target.value),
                    },
                  })
                }
                fullWidth
              />
            )}
            <TextField
              label="Concurrency"
              type="number"
              inputProps={{ min: 1, max: 16 }}
              value={draft.concurrency}
              onChange={(e) =>
                setDraft({ ...draft, concurrency: Number(e.target.value) })
              }
              fullWidth
            />
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={draft.enabled}
                onChange={(e) =>
                  setDraft({ ...draft, enabled: e.target.checked })
                }
              />
            }
            label="Enabled"
          />
          {err && (
            <Box sx={{ color: 'error.main', fontSize: 14 }} role="alert">
              {err}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
