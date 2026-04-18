'use client';

import * as React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';

export type RowActionTone = 'neutral' | 'brand' | 'success' | 'danger';

interface BaseProps {
  icon?: React.ReactNode;
  label: string;
  tone?: RowActionTone;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
}

interface InlineProps extends BaseProps {
  variant?: 'inline';
  hideLabel?: boolean;
}

interface IconOnlyProps extends BaseProps {
  variant: 'icon';
}

const TONE_STYLES: Record<
  RowActionTone,
  { color: string; hoverBg: string; hoverBorder: string }
> = {
  neutral: {
    color: '#374151',
    hoverBg: '#F9FAFB',
    hoverBorder: '#9CA3AF',
  },
  brand: {
    color: '#0021A5',
    hoverBg: '#EEF2FF',
    hoverBorder: '#0021A5',
  },
  success: {
    color: '#047857',
    hoverBg: '#ECFDF5',
    hoverBorder: '#10B981',
  },
  danger: {
    color: '#B91C1C',
    hoverBg: '#FEF2F2',
    hoverBorder: '#EF4444',
  },
};

export function RowActionButton(props: InlineProps | IconOnlyProps) {
  const tone = props.tone ?? 'neutral';
  const t = TONE_STYLES[tone];

  if (props.variant === 'icon') {
    return (
      <Tooltip title={props.label} enterDelay={300}>
        <span>
          <IconButton
            size="small"
            disabled={props.disabled}
            onClick={props.onClick}
            aria-label={props.label}
            sx={{
              width: 30,
              height: 30,
              borderRadius: '6px',
              color: t.color,
              border: '1px solid transparent',
              '&:hover': {
                backgroundColor: t.hoverBg,
                borderColor: t.hoverBorder,
              },
            }}
          >
            {props.icon}
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  const { hideLabel } = props;

  return (
    <Button
      size="small"
      variant="outlined"
      disabled={props.disabled}
      onClick={props.onClick}
      startIcon={props.icon}
      aria-label={props.label}
      sx={{
        textTransform: 'none',
        fontSize: 12,
        fontWeight: 500,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: t.color,
        borderColor: '#E5E7EB',
        borderRadius: '6px',
        px: hideLabel ? 0.75 : 1.25,
        py: 0.25,
        height: 28,
        minWidth: hideLabel ? 30 : 'auto',
        backgroundColor: '#FFFFFF',
        '& .MuiButton-startIcon': { mx: hideLabel ? 0 : 0.5 },
        '&:hover': {
          backgroundColor: t.hoverBg,
          borderColor: t.hoverBorder,
        },
      }}
    >
      {hideLabel ? null : props.label}
    </Button>
  );
}
