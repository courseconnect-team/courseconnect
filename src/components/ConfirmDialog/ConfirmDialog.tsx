// components/ConfirmDialog.tsx
'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import type { DialogProps } from '@mui/material/Dialog';

export type ConfirmDialogProps = {
  open: boolean;
  /** Title area (string or custom node) */
  title: React.ReactNode;
  /** Optional body text; use `children` for fully custom content */
  description?: React.ReactNode;
  /** Custom body content */
  children?: React.ReactNode;

  /** Called when dialog should close */
  onClose: (
    event?: unknown,
    reason?: 'backdropClick' | 'escapeKeyDown' | 'closeButton'
  ) => void;

  /** Default actions (rendered when `actions` prop is not provided) */
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmColor?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'success'
    | 'warning'
    | 'info';
  cancelLabel?: string;
  onCancel?: () => void;

  /** Replace the whole actions row */
  actions?: React.ReactNode;

  /** UI/behavior */
  loading?: boolean; // show spinner in confirm button
  disableBackdropClose?: boolean; // block closing via ESC/backdrop
  fullWidth?: boolean;
  maxWidth?: DialogProps['maxWidth']; // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
};

export default function ConfirmDialog({
  open,
  title,
  description,
  children,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onCancel,
  actions,
  loading = false,
  disableBackdropClose = false,
  fullWidth = true,
  maxWidth = 'xs',
}: ConfirmDialogProps) {
  const handleClose: DialogProps['onClose'] = (e, reason) => {
    if (
      disableBackdropClose &&
      (reason === 'backdropClick' || reason === 'escapeKeyDown')
    )
      return;
    onClose?.(e, reason);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      keepMounted
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1,
        }}
      >
        <span className="text-h5 font-semibold">{title}</span>
        <IconButton
          aria-label="Close"
          onClick={(e) => onClose?.(e, 'closeButton')}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {(description || children) && (
        <DialogContent sx={{ pt: 0 }}>
          {description && (
            <p className="text-body1 text-gray-600">{description}</p>
          )}
          {children}
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {actions ? (
          actions
        ) : (
          <>
            <Button
              variant="text"
              onClick={() => {
                onCancel?.();
                onClose?.();
              }}
              className="!text-primary "
            >
              {cancelLabel}
            </Button>

            <Button
              variant="contained"
              onClick={onConfirm}
              disabled={loading}
              className="!bg-primary !text-on-primary hover:underline hover:!bg-primary-light hover:!text-primary normal-case"
            >
              {loading ? (
                <CircularProgress size={18} sx={{ color: 'white' }} />
              ) : (
                confirmLabel
              )}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
