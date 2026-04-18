'use client';

import * as React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'neutral' | 'brand';
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onCancel,
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const accent =
    tone === 'danger' ? '#DC2626' : tone === 'brand' ? '#0021A5' : '#374151';

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      PaperProps={{
        sx: {
          borderRadius: '12px',
          minWidth: 420,
          maxWidth: 480,
          boxShadow: '0 20px 50px -12px rgba(0,0,0,0.2)',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          fontSize: 17,
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          color: '#111827',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          {tone === 'danger' && (
            <WarningAmberRoundedIcon sx={{ color: accent, fontSize: 22 }} />
          )}
          <span>{title}</span>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        {description && (
          <DialogContentText
            sx={{
              fontFamily: 'Inter, sans-serif',
              color: '#4B5563',
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            {description}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            borderColor: '#D1D5DB',
            color: '#374151',
            fontWeight: 500,
            '&:hover': { borderColor: '#9CA3AF', backgroundColor: '#F9FAFB' },
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            backgroundColor: accent,
            boxShadow: 'none',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: accent,
              filter: 'brightness(0.92)',
              boxShadow: 'none',
            },
          }}
        >
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
