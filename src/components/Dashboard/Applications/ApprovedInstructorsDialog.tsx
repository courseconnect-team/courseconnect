'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import firebase from '@/firebase/firebase_config';
import { StatusPill } from '@/components/common/AdminDataTable';
import 'firebase/firestore';
import {
  buildApprovalEntries,
  formatCourseCode,
  type ApprovalEntry,
  type AssignmentRef,
} from '@/utils/approvalAssignments';
import { facultyApprovalPill } from './courseStatus';

/** Why a row carries the approval pill it does. */
function verdictHelp(facultyApproved: boolean | null): string {
  if (facultyApproved === true)
    return 'A professor approved this student for this course.';
  if (facultyApproved === false)
    return 'An admin assigned this course without a faculty approval on file.';
  return 'This course was assigned before the faculty verdict was recorded, so it cannot be shown.';
}

export interface ApplyAssignmentChange {
  studentUid: string;
  /** Assignments to drop — entries that were checked and got unchecked. */
  removals: ApprovalEntry[];
  /** Assignments to create — entries that got checked. */
  additions: ApprovalEntry[];
  hours: string;
}

interface ApprovedInstructorsDialogProps {
  open: boolean;
  studentUid: string | null;
  studentName: string;
  onClose: () => void;
  onApply: (change: ApplyAssignmentChange) => Promise<void>;
}

const BRAND = '#0021A5';

const applicationDoc = (id: string) =>
  firebase
    .firestore()
    .collection('applications')
    .doc('course_assistant')
    .collection('uid')
    .doc(id);

/**
 * Every instructor who approved one applicant, with the assignment they
 * currently hold checked off.
 *
 * A checked box means "this student holds this course". Unchecking de-assigns;
 * checking another instructor assigns. Doing both in one pass is a
 * reassignment, and the parent drops the old assignment before writing the new
 * one so the student is never briefly holding two.
 *
 * Checkboxes rather than radios because a student really can hold two courses
 * at once — the assign flow writes a second `${uid}-N` doc — and a single-choice
 * control would show only one of them and silently drop the other on save.
 *
 * Nothing is written until the confirm button: the parent owns the writes, so
 * an assignment made here goes through exactly the same path as the row-level
 * Approve action.
 */
export default function ApprovedInstructorsDialog({
  open,
  studentUid,
  studentName,
  onClose,
  onApply,
}: ApprovedInstructorsDialogProps) {
  const [entries, setEntries] = React.useState<ApprovalEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
    () => new Set()
  );
  const [hours, setHours] = React.useState('0');

  const toggle = (key: string) =>
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  React.useEffect(() => {
    if (!open || !studentUid) return;
    let cancelled = false;
    setEntries([]);
    setSelectedKeys(new Set());
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [appSnap, assignSnap] = await Promise.all([
          applicationDoc(studentUid).get(),
          firebase
            .firestore()
            .collection('assignments')
            .where('student_uid', '==', studentUid)
            .get(),
        ]);
        if (cancelled) return;

        const assignments: AssignmentRef[] = assignSnap.docs.map((d) => ({
          id: d.id,
          class_codes: d.data()?.class_codes,
          semesters: d.data()?.semesters,
          prior_course_status: d.data()?.prior_course_status,
        }));
        const built = buildApprovalEntries(
          appSnap.data()?.courses,
          assignments
        );
        const current = built.find((e) => e.assignmentId) ?? null;

        // Carry the hours already on record so a reassignment doesn't quietly
        // reset an appointment to zero hours.
        const currentHours = current
          ? assignSnap.docs.find((d) => d.id === current.assignmentId)?.data()
              ?.hours
          : undefined;

        setEntries(built);
        setSelectedKeys(
          new Set(built.filter((e) => e.assignmentId).map((e) => e.key))
        );
        setHours(
          String(Array.isArray(currentHours) ? currentHours[0] ?? 0 : 0)
        );
      } catch (err) {
        console.error('Error loading approvals:', err);
        if (!cancelled)
          setError('Could not load approvals for this applicant.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, studentUid]);

  const additions = entries.filter(
    (e) => selectedKeys.has(e.key) && !e.assignmentId
  );
  const removals = entries.filter(
    (e) => e.assignmentId && !selectedKeys.has(e.key)
  );
  const changed = additions.length > 0 || removals.length > 0;

  const confirmLabel = !additions.length
    ? 'Unassign'
    : removals.length
    ? 'Reassign'
    : 'Assign';

  const handleApply = async () => {
    if (!studentUid || !changed) return;
    setSaving(true);
    try {
      await onApply({ studentUid, removals, additions, hours });
      onClose();
    } catch (err) {
      console.error('Error applying assignment change:', err);
      setError('Could not update the assignment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 20px 50px -12px rgba(0,0,0,0.2)',
        },
      }}
    >
      <DialogTitle
        sx={{
          pr: 6,
          fontSize: 20,
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          color: '#111827',
        }}
      >
        {studentName ? `${studentName} Assignment` : 'Assignment'}
        <IconButton
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
          sx={{ position: 'absolute', top: 12, right: 12, color: '#6B7280' }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            lineHeight: 1.55,
            color: '#4B5563',
          }}
        >
          View all instructors who have approved this student below. A checked
          box indicates that the student has been assigned to that instructor.
        </DialogContentText>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={26} />
          </Box>
        ) : entries.length === 0 ? (
          <Box sx={{ py: 4, fontSize: 14, color: '#6B7280' }}>
            No instructor has approved this student yet.
          </Box>
        ) : (
          <Stack sx={{ mt: 2.5 }} spacing={0.5}>
            {entries.map((entry) => {
              const isSelected = selectedKeys.has(entry.key);
              const pill = facultyApprovalPill(entry.facultyApproved);
              return (
                // The row is the click target; the checkbox inside carries the
                // accessible name and keeps keyboard toggling working, since a
                // space press on it clicks through to this handler.
                <Box
                  key={entry.key}
                  onClick={() => toggle(entry.key)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1,
                    py: 1,
                    borderRadius: '8px',
                    cursor: saving ? 'default' : 'pointer',
                    pointerEvents: saving ? 'none' : 'auto',
                    '&:hover': { backgroundColor: '#F9FAFB' },
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    disableRipple
                    inputProps={{
                      'aria-label': `${
                        entry.instructor || 'Instructor unknown'
                      } — ${formatCourseCode(entry.code)}${
                        entry.semester ? ` ${entry.semester}` : ''
                      }`,
                    }}
                    sx={{
                      p: 0.5,
                      color: '#9CA3AF',
                      '&.Mui-checked': { color: BRAND },
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Box
                        sx={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.instructor || 'Instructor unknown'}
                      </Box>
                      <Tooltip title={verdictHelp(entry.facultyApproved)}>
                        <Box component="span" sx={{ display: 'inline-flex' }}>
                          <StatusPill label={pill.label} tone={pill.tone} />
                        </Box>
                      </Tooltip>
                    </Box>
                    <Box sx={{ fontSize: 13, color: '#6B7280' }}>
                      {formatCourseCode(entry.code)}
                      {entry.semester ? ` · ${entry.semester}` : ''}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}

        {additions.length > 0 && (
          <TextField
            label="Hours per week"
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            size="small"
            disabled={saving}
            sx={{ mt: 3, maxWidth: 180 }}
            inputProps={{ min: 0 }}
          />
        )}

        {error && (
          <Box sx={{ mt: 2, fontSize: 13, color: '#DC2626' }}>{error}</Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ textTransform: 'none', color: BRAND, fontWeight: 500 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!changed || saving || loading}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            px: 3,
            backgroundColor: BRAND,
            boxShadow: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: BRAND,
              filter: 'brightness(0.92)',
              boxShadow: 'none',
            },
          }}
        >
          {saving ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
