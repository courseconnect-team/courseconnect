'use client';

import * as React from 'react';
import { Box, Typography } from '@mui/material';

export type StatusTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'brand';

const TONES: Record<
  StatusTone,
  { bg: string; fg: string; dot: string; border: string }
> = {
  neutral: {
    bg: '#F3F4F6',
    fg: '#374151',
    dot: '#6B7280',
    border: '#E5E7EB',
  },
  success: {
    bg: '#ECFDF5',
    fg: '#065F46',
    dot: '#10B981',
    border: '#A7F3D0',
  },
  warning: {
    bg: '#FFFBEB',
    fg: '#92400E',
    dot: '#F59E0B',
    border: '#FDE68A',
  },
  danger: {
    bg: '#FEF2F2',
    fg: '#991B1B',
    dot: '#EF4444',
    border: '#FECACA',
  },
  info: { bg: '#EFF6FF', fg: '#1E40AF', dot: '#3B82F6', border: '#BFDBFE' },
  brand: { bg: '#EEF2FF', fg: '#0021A5', dot: '#0021A5', border: '#C7D2FE' },
};

export interface StatusPillProps {
  label: React.ReactNode;
  tone?: StatusTone;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusPill({
  label,
  tone = 'neutral',
  dot = true,
  size = 'sm',
}: StatusPillProps) {
  const t = TONES[tone];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: size === 'sm' ? 1 : 1.25,
        py: size === 'sm' ? 0.25 : 0.5,
        borderRadius: '999px',
        backgroundColor: t.bg,
        border: `1px solid ${t.border}`,
        color: t.fg,
        fontWeight: 500,
        fontSize: size === 'sm' ? 12 : 13,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {dot && (
        <Box
          component="span"
          sx={{
            width: 6,
            height: 6,
            borderRadius: '999px',
            backgroundColor: t.dot,
            flexShrink: 0,
          }}
        />
      )}
      <Typography
        component="span"
        sx={{ fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 1 }}
      >
        {label}
      </Typography>
    </Box>
  );
}
