'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

const PURPLE = '#562EBA';

export interface SemesterStatusProps {
  semester: string;
  semesters: string[];
  semesterHidden: boolean;
  onSemesterChange: (value: string) => void;
  onSemesterCreated: (value: string) => void;
  onToggleHidden: () => void;
}

// A subscription-based course count so the number reflects auto-fetch writes
// landing in real time without the admin having to refresh the tab.
function useSemesterStats(semester: string) {
  const [count, setCount] = React.useState<number | null>(null);
  const [autoCount, setAutoCount] = React.useState(0);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (!semester) {
      setCount(0);
      setAutoCount(0);
      setLastUpdated(null);
      return;
    }
    const ref = firebase
      .firestore()
      .collection('semesters')
      .doc(semester)
      .collection('courses');
    const unsub = ref.onSnapshot(
      (snap) => {
        setCount(snap.size);
        let autos = 0;
        let latest = 0;
        snap.forEach((doc) => {
          const data = doc.data() as Record<string, unknown>;
          if (data.source === 'auto-fetch') autos++;
          const ts = data.updated_at as { toMillis?: () => number } | undefined;
          const ms =
            ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
          if (ms > latest) latest = ms;
        });
        setAutoCount(autos);
        setLastUpdated(latest ? new Date(latest) : null);
      },
      () => {
        setCount(null);
      }
    );
    return () => unsub();
  }, [semester]);

  return { count, autoCount, lastUpdated };
}

function relativeTime(date: Date | null): string {
  if (!date) return 'never';
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function SemesterStatus({
  semester,
  semesters,
  semesterHidden,
  onSemesterChange,
  onSemesterCreated,
  onToggleHidden,
}: SemesterStatusProps) {
  const [openCreate, setOpenCreate] = React.useState(false);
  const [newSem, setNewSem] = React.useState('');
  const { count, autoCount, lastUpdated } = useSemesterStats(semester);
  const manualCount = count == null ? null : Math.max(0, count - autoCount);

  const handleChange = (val: string) => {
    if (val === '__new__') setOpenCreate(true);
    else onSemesterChange(val);
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSem.trim()) return;
    await firebase
      .firestore()
      .collection('semesters')
      .doc(newSem.trim())
      .set({ semester: newSem.trim(), hidden: false }, { merge: true });
    onSemesterCreated(newSem.trim());
    setNewSem('');
    setOpenCreate(false);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'white',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={2.5} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="semester-label">Semester</InputLabel>
              <Select
                labelId="semester-label"
                value={semester}
                label="Semester"
                onChange={(e) => handleChange(String(e.target.value))}
              >
                {semesters.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
                <MenuItem value="__new__">+ Create new semester</MenuItem>
              </Select>
            </FormControl>

            <Stack spacing={0.25}>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                Courses in {semester || '—'}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="baseline">
                <Typography
                  sx={{ fontWeight: 700, fontSize: 28, color: PURPLE }}
                >
                  {count == null ? '—' : count}
                </Typography>
                {count != null && (
                  <Typography variant="body2" color="text.secondary">
                    {autoCount} auto-fetched · {manualCount} uploaded
                  </Typography>
                )}
              </Stack>
            </Stack>

            <Box
              sx={{
                height: 40,
                borderLeft: '1px solid',
                borderColor: 'divider',
              }}
            />

            <Stack spacing={0.25}>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                Last updated
              </Typography>
              <Typography sx={{ fontWeight: 500 }}>
                {relativeTime(lastUpdated)}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              icon={
                semesterHidden ? (
                  <VisibilityOffIcon style={{ fontSize: 14 }} />
                ) : (
                  <VisibilityIcon style={{ fontSize: 14 }} />
                )
              }
              label={semesterHidden ? 'Hidden from users' : 'Visible to users'}
              color={semesterHidden ? 'default' : 'success'}
              variant={semesterHidden ? 'outlined' : 'filled'}
              sx={{ fontWeight: 500 }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={onToggleHidden}
              startIcon={
                semesterHidden ? <VisibilityIcon /> : <VisibilityOffIcon />
              }
              sx={{ textTransform: 'none' }}
            >
              {semesterHidden ? 'Unhide' : 'Hide'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
        <DialogTitle>Create semester</DialogTitle>
        <form onSubmit={handleCreate}>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Use the same casing auto-fetch produces (e.g.{' '}
              <strong>Spring 2026</strong>) so workflows writing to the same
              term don&apos;t create a second semester doc.
            </DialogContentText>
            <TextField
              autoFocus
              fullWidth
              required
              label="Semester name"
              value={newSem}
              onChange={(e) => setNewSem(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              sx={{
                textTransform: 'none',
                bgcolor: PURPLE,
                '&:hover': { bgcolor: '#4524a0' },
              }}
            >
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
