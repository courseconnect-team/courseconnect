'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
  onApply: (selectedCodes: string[]) => void;
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

// Courses that pass the current tab filter (before search).
function coursesMatchingFilter(
  courses: PreviewCourse[],
  filter: Filter
): PreviewCourse[] {
  if (filter === 'all') return courses;
  return courses.filter((c) => c.sections.some((s) => s.diffStatus === filter));
}

function countSelection(
  courses: PreviewCourse[],
  selected: Set<string>,
  filter: Filter
): { courses: number; sections: number } {
  let cCount = 0;
  let sCount = 0;
  for (const c of courses) {
    if (!selected.has(c.code)) continue;
    const sections =
      filter === 'all'
        ? c.sections
        : c.sections.filter((s) => s.diffStatus === filter);
    if (sections.length === 0) continue;
    cCount++;
    sCount += sections.length;
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
  checked,
  onToggleChecked,
}: {
  course: PreviewCourse;
  filter: Filter;
  initiallyExpanded: boolean;
  checked: boolean;
  onToggleChecked: () => void;
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
        borderColor: checked ? 'rgba(86,46,186,0.35)' : 'divider',
        bgcolor: checked ? 'white' : 'rgba(0,0,0,0.02)',
        overflow: 'hidden',
        opacity: checked ? 1 : 0.7,
        transition: 'border-color 120ms, background-color 120ms, opacity 120ms',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: 1,
          py: 1.25,
          bgcolor: '#fafafa',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <Checkbox
          size="small"
          checked={checked}
          onClick={(e) => e.stopPropagation()}
          onChange={onToggleChecked}
          sx={{
            color: 'rgba(86,46,186,0.5)',
            '&.Mui-checked': { color: PURPLE },
          }}
          inputProps={{ 'aria-label': `Include ${course.code} in apply` }}
        />
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
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  // Default selection = every course in the preview (nothing excluded).
  React.useEffect(() => {
    if (!open) return;
    setFilter('all');
    setSearch('');
    setSelected(new Set(preview?.courses.map((c) => c.code) ?? []));
  }, [open, preview]);

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

  const visibleCodes = React.useMemo(
    () => filteredCourses.map((c) => c.code),
    [filteredCourses]
  );

  const selectionCounts = preview
    ? countSelection(preview.courses, selected, filter)
    : { courses: 0, sections: 0 };

  const totalNewInSelection = preview
    ? preview.courses.reduce(
        (acc, c) =>
          selected.has(c.code)
            ? acc + c.sections.filter((s) => s.diffStatus === 'new').length
            : acc,
        0
      )
    : 0;
  const totalUpdatedInSelection = preview
    ? preview.courses.reduce(
        (acc, c) =>
          selected.has(c.code)
            ? acc + c.sections.filter((s) => s.diffStatus === 'updated').length
            : acc,
        0
      )
    : 0;

  const visibleSelectedCount = visibleCodes.reduce(
    (acc, code) => (selected.has(code) ? acc + 1 : acc),
    0
  );
  const allVisibleSelected =
    visibleCodes.length > 0 && visibleSelectedCount === visibleCodes.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  const toggleCourse = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const selectVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const code of visibleCodes) next.add(code);
      return next;
    });
  };

  const clearVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const code of visibleCodes) next.delete(code);
      return next;
    });
  };

  const selectOnlyStatus = (status: 'new' | 'updated') => {
    if (!preview) return;
    // Restrict to the currently searched set, but ignore the tab filter so
    // this action is predictable no matter which tab you're on.
    const term = search.trim().toLowerCase();
    const matchesSearch = (c: PreviewCourse) => {
      if (!term) return true;
      const hay = `${c.code} ${c.title} ${c.department ?? ''}`.toLowerCase();
      return hay.includes(term);
    };
    const next = new Set<string>();
    for (const c of preview.courses) {
      if (!matchesSearch(c)) continue;
      if (c.sections.some((s) => s.diffStatus === status)) next.add(c.code);
    }
    setSelected(next);
  };

  const canApply =
    !applying &&
    !!preview &&
    preview.status !== 'failed' &&
    selectionCounts.sections > 0;

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
                Showing the first 1000 courses. Apply will write every course
                you select below.
              </Alert>
            )}

            {preview.sectionCount === 0 && preview.status === 'success' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Zero courses matched this workflow&apos;s filters. Adjust the
                filters and try again.
              </Alert>
            )}

            {/* Filters + quick actions */}
            {preview.sectionCount > 0 && (
              <Stack spacing={1.25} sx={{ mb: 1.5 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
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
                    <Tab value="all" label={`All (${preview.sectionCount})`} />
                    <Tab
                      value="new"
                      label={`New (${preview.newSectionCount})`}
                    />
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

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: '#fafafa',
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={() =>
                      allVisibleSelected ? clearVisible() : selectVisible()
                    }
                    disabled={visibleCodes.length === 0}
                    sx={{
                      color: 'rgba(86,46,186,0.5)',
                      '&.Mui-checked': { color: PURPLE },
                      '&.MuiCheckbox-indeterminate': { color: PURPLE },
                    }}
                    inputProps={{ 'aria-label': 'Select all visible courses' }}
                  />
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    <strong>{selectionCounts.courses}</strong> of{' '}
                    {preview.courseCount} courses selected
                  </Typography>
                  <Button
                    size="small"
                    onClick={selectVisible}
                    disabled={visibleCodes.length === 0 || allVisibleSelected}
                    sx={{ textTransform: 'none' }}
                  >
                    Select all visible
                  </Button>
                  <Button
                    size="small"
                    onClick={clearVisible}
                    disabled={visibleSelectedCount === 0}
                    sx={{ textTransform: 'none' }}
                  >
                    Clear visible
                  </Button>
                  <Divider orientation="vertical" flexItem />
                  <Button
                    size="small"
                    onClick={() => selectOnlyStatus('new')}
                    disabled={preview.newSectionCount === 0}
                    sx={{ textTransform: 'none' }}
                  >
                    Select new only
                  </Button>
                  <Button
                    size="small"
                    onClick={() => selectOnlyStatus('updated')}
                    disabled={preview.updatedSectionCount === 0}
                    sx={{ textTransform: 'none' }}
                  >
                    Select updates only
                  </Button>
                  <Divider orientation="vertical" flexItem />
                  <Button
                    size="small"
                    onClick={() => setSelected(new Set())}
                    disabled={selected.size === 0}
                    sx={{ textTransform: 'none' }}
                  >
                    Clear all
                  </Button>
                </Stack>
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
                  checked={selected.has(c.code)}
                  onToggleChecked={() => toggleCourse(c.code)}
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
            ? `Applying ${selectionCounts.courses} courses · ${selectionCounts.sections} sections` +
              (totalNewInSelection || totalUpdatedInSelection
                ? ` (${totalNewInSelection} new, ${totalUpdatedInSelection} updates)`
                : '')
            : ''}
        </Typography>
        <Button onClick={onClose} disabled={applying}>
          Close
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={() => onApply(Array.from(selected))}
          disabled={!canApply}
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
            : `Apply ${selectionCounts.courses} course${
                selectionCounts.courses === 1 ? '' : 's'
              } to ${preview?.targetSemester ?? 'semester'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
