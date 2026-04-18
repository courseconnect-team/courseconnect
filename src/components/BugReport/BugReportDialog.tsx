'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import { useBugReport } from '@/contexts/BugReportContext';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';

const BugReportDialog: React.FC = () => {
  const { isOpen, close } = useBugReport();
  const [user, role] = useUserInfo() as [any, string, boolean, any];
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setSummary('');
    setDescription('');
    setSeverity('medium');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (submitting) return;
    close();
    setTimeout(reset, 200);
  };

  const handleSubmit = async () => {
    if (!summary.trim() || !description.trim()) {
      setError('Please add a short summary and a description.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: summary.trim(),
          description: description.trim(),
          severity,
          pageUrl:
            typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          user: {
            uid: user?.uid,
            email: user?.email ?? undefined,
            displayName: user?.displayName ?? undefined,
            role: typeof role === 'string' ? role : undefined,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not send the bug report.');
      }
      setSuccess(true);
      setTimeout(() => {
        close();
        reset();
      }, 1200);
    } catch (e: any) {
      setError(e.message || 'Could not send the bug report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600, color: '#1E1442' }}>
        Report a bug
      </DialogTitle>
      <DialogContent dividers>
        {success ? (
          <Alert severity="success">
            Thanks! Your report was sent to the CourseConnect team.
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Short summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              fullWidth
              required
              inputProps={{ maxLength: 140 }}
              helperText={`${summary.length}/140`}
              sx={{ mb: 2 }}
              disabled={submitting}
            />
            <TextField
              label="What happened? Include steps to reproduce if you can."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              required
              multiline
              minRows={5}
              inputProps={{ maxLength: 4000 }}
              sx={{ mb: 2 }}
              disabled={submitting}
            />
            <TextField
              label="Severity"
              value={severity}
              onChange={(e) =>
                setSeverity(e.target.value as 'low' | 'medium' | 'high')
              }
              select
              fullWidth
              disabled={submitting}
            >
              <MenuItem value="low">Low — minor annoyance</MenuItem>
              <MenuItem value="medium">Medium — noticeable issue</MenuItem>
              <MenuItem value="high">High — blocker / broken</MenuItem>
            </TextField>
            <p className="text-xs text-[#6B5AA8] mt-3">
              We&apos;ll include your email, role, and the page URL so the team
              can follow up.
            </p>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant="contained"
            sx={{
              backgroundColor: '#5A41D8',
              '&:hover': { backgroundColor: '#2d0f83' },
            }}
            startIcon={
              submitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <BugReportOutlinedIcon />
              )
            }
          >
            {submitting ? 'Sending…' : 'Send report'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BugReportDialog;
