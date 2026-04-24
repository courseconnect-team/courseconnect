'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type {
  CourseFetchConfig,
  CoursePreview,
  PreviewCourse,
  PreviewSection,
} from '@/types/courseFetch';

const PURPLE = '#562EBA';

type Filter = 'all' | 'new' | 'updated';

export interface PreviewDialogProps {
  open: boolean;
  config: CourseFetchConfig | null;
  preview: CoursePreview | null;
  loading: boolean;
  loadError: string | null;
  applying: boolean;
  onClose: () => void;
  onApply: () => void;
  onRetry: () => void;
}

// --- formatting helpers ---

function formatMeeting(m: PreviewSection['meetingTimes'][number]): string {
  const time =
    m.startTime && m.endTime
      ? `${m.startTime}–${m.endTime}`
      : m.startTime ?? m.endTime ?? m.rawTime ?? '—';
  const where = m.location ?? '';
  const day = m.day || 'TBA';
  return where ? `${day} ${time} · ${where}` : `${day} ${time}`;
}

function sectionSummary(s: PreviewSection): string {
  const names = s.instructors
    .map((i) => i.name)
    .filter(Boolean)
    .join(', ');
  return names || 'Instructor TBA';
}

function countInFilter(
  courses: PreviewCourse[],
  filter: Filter
): { courses: number; sections: number } {
  if (filter === 'all') {
    return {
      courses: courses.length,
      sections: courses.reduce((acc, c) => acc + c.sections.length, 0),
    };
  }
  let cCount = 0;
  let sCount = 0;
  for (const c of courses) {
    const matching = c.sections.filter((s) => s.diffStatus === filter);
    if (matching.length > 0) cCount++;
    sCount += matching.length;
  }
  return { courses: cCount, sections: sCount };
}

// --- subcomponents ---

function StatTile(props: {
  label: string;
  value: React.ReactNode;
  color?: string;
  accent?: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 140,
        py: 1.5,
        px: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: props.accent ? 'rgba(86,46,186,0.25)' : 'divider',
        bgcolor: props.accent ? 'rgba(86,46,186,0.04)' : 'white',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {props.label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: 24,
          color: props.color ?? 'text.primary',
          lineHeight: 1.2,
        }}
      >
        {props.value}
      </Typography>
    </Paper>
  );
}

function SectionRow({ section }: { section: PreviewSection }) {
  const isNew = section.diffStatus === 'new';
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      spacing={1.5}
      sx={{
        py: 1,
        px: 1.5,
        borderLeft: '3px solid',
        borderLeftColor: isNew ? 'success.light' : 'warning.light',
        bgcolor: isNew ? 'rgba(76,175,80,0.04)' : 'rgba(237,108,2,0.04)',
        borderRadius: 1,
        mb: 0.5,
      }}
    >
      <Chip
        size="small"
        label={isNew ? 'new' : 'update'}
        color={isNew ? 'success' : 'warning'}
        sx={{ minWidth: 64, fontWeight: 600 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
          {section.classNumber}
          {section.sectionNumber ? ` · §${section.sectionNumber}` : ''} ·{' '}
          {sectionSummary(section)}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', lineHeight: 1.5 }}
        >
          {section.meetingTimes.length === 0
            ? 'No meeting times'
            : section.meetingTimes.map(formatMeeting).join(' · ')}
          {section.enrollmentCap != null && (
            <>
              {' · '}
              {section.enrolled ?? '?'} / {section.enrollmentCap} enrolled
            </>
          )}
          {section.campus && <> · {section.campus}</>}
        </Typography>
      </Box>
    </Stack>
  );
}

function CourseCard({
  course,
  filter,
  initiallyExpanded,
}: {
  course: PreviewCourse;
  filter: Filter;
  initiallyExpanded: boolean;
}) {
  const [expanded, setExpanded] = React.useState(initiallyExpanded);
  const sections =
    filter === 'all'
      ? course.sections
      : course.sections.filter((s) => s.diffStatus === filter);
  if (sections.length === 0) return null;

  const newCount = sections.filter((s) => s.diffStatus === 'new').length;
  const updatedCount = sections.length - newCount;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: '#fafafa',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
            {course.codeWithSpace} · {course.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {course.department ?? ''}
            {course.credits ? ` · ${course.credits} cr` : ''}
          </Typography>
        </Box>
        {newCount > 0 && (
          <Chip size="small" color="success" label={`${newCount} new`} />
        )}
        {updatedCount > 0 && (
          <Chip
            size="small"
            color="warning"
            label={`${updatedCount} update${updatedCount === 1 ? '' : 's'}`}
          />
        )}
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Stack>
      {expanded && (
        <Box sx={{ p: 1.25 }}>
          {sections.map((s) => (
            <SectionRow key={s.classNumber} section={s} />
          ))}
        </Box>
      )}
    </Paper>
  );
}

// --- main ---

export default function PreviewDialog({
  open,
  config,
  preview,
  loading,
  loadError,
  applying,
  onClose,
  onApply,
  onRetry,
}: PreviewDialogProps) {
  const [filter, setFilter] = React.useState<Filter>('all');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setFilter('all');
      setSearch('');
    }
  }, [open]);

  const filteredCourses = React.useMemo(() => {
    if (!preview) return [] as PreviewCourse[];
    const term = search.trim().toLowerCase();
    return preview.courses.filter((c) => {
      if (term) {
        const hay = `${c.code} ${c.title} ${c.department ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (filter === 'all') return true;
      return c.sections.some((s) => s.diffStatus === filter);
    });
  }, [preview, search, filter]);

  const counts = preview
    ? countInFilter(preview.courses, filter)
    : { courses: 0, sections: 0 };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pr: 6 }}>
        Preview {config ? `· ${config.label}` : ''}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {loading && (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 5 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Running dry fetch — this can take 10–30 seconds…
            </Typography>
            <LinearProgress sx={{ width: '60%', maxWidth: 320 }} />
          </Stack>
        )}

        {loadError && !loading && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={onRetry}>
                Retry
              </Button>
            }
          >
            {loadError}
          </Alert>
        )}

        {preview && !loading && (
          <>
            {/* Summary */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <StatTile
                label={`Target`}
                value={preview.targetSemester}
                accent
                color={PURPLE}
              />
              <StatTile
                label="New sections"
                value={preview.newSectionCount}
                color="#2e7d32"
              />
              <StatTile
                label="Updates"
                value={preview.updatedSectionCount}
                color="#ed6c02"
              />
              <StatTile label="Total sections" value={preview.sectionCount} />
              <StatTile label="Courses" value={preview.courseCount} />
            </Stack>

            {preview.status !== 'success' && (
              <Alert
                severity={preview.status === 'failed' ? 'error' : 'warning'}
                sx={{ mb: 2 }}
              >
                <Typography sx={{ fontWeight: 600 }}>
                  {preview.status === 'failed'
                    ? 'The fetch failed.'
                    : 'Partial results — some shards failed.'}
                </Typography>
                {preview.errors.slice(0, 3).map((e, i) => (
                  <Typography key={i} variant="body2">
                    {e}
                  </Typography>
                ))}
              </Alert>
            )}

            {preview.truncated && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Showing the first 1000 courses. Apply will write all{' '}
                {preview.courseCount} courses.
              </Alert>
            )}

            {preview.sectionCount === 0 && preview.status === 'success' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Zero courses matched this workflow&apos;s filters. Adjust the
                filters and try again.
              </Alert>
            )}

            {/* Filters */}
            {preview.sectionCount > 0 && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                sx={{ mb: 1.5 }}
              >
                <Tabs
                  value={filter}
                  onChange={(_, v) => setFilter(v)}
                  sx={{
                    minHeight: 36,
                    '& .MuiTab-root': {
                      minHeight: 36,
                      textTransform: 'none',
                      fontWeight: 600,
                    },
                    '& .Mui-selected': { color: `${PURPLE} !important` },
                    '& .MuiTabs-indicator': { backgroundColor: PURPLE },
                  }}
                >
                  <Tab
                    value="all"
                    label={`All (${
                      countInFilter(preview.courses, 'all').sections
                    })`}
                  />
                  <Tab value="new" label={`New (${preview.newSectionCount})`} />
                  <Tab
                    value="updated"
                    label={`Updates (${preview.updatedSectionCount})`}
                  />
                </Tabs>
                <Box sx={{ flex: 1 }} />
                <TextField
                  size="small"
                  placeholder="Filter by code or title…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ minWidth: 260 }}
                />
              </Stack>
            )}

            <Divider sx={{ mb: 1.5 }} />

            {/* List */}
            <Stack spacing={1}>
              {filteredCourses.map((c) => (
                <CourseCard
                  key={c.code}
                  course={c}
                  filter={filter}
                  initiallyExpanded={filteredCourses.length <= 5}
                />
              ))}
              {filteredCourses.length === 0 && preview.sectionCount > 0 && (
                <Typography
                  color="text.secondary"
                  sx={{ py: 3, textAlign: 'center' }}
                >
                  Nothing matches the current filter or search.
                </Typography>
              )}
            </Stack>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {preview
            ? `${counts.courses} courses · ${counts.sections} sections in current view`
            : ''}
        </Typography>
        <Button onClick={onClose} disabled={applying}>
          Close
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={onApply}
          disabled={
            applying ||
            !preview ||
            preview.status === 'failed' ||
            preview.sectionCount === 0
          }
          startIcon={
            applying ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <PlayArrowIcon />
            )
          }
          sx={{
            textTransform: 'none',
            bgcolor: PURPLE,
            '&:hover': { bgcolor: '#4524a0' },
          }}
        >
          {applying
            ? 'Applying…'
            : `Apply to ${preview?.targetSemester ?? 'semester'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
