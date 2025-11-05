import * as React from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import { SxProps, Theme } from '@mui/material/styles';
import { SystemStyleObject } from '@mui/system';

type Sizeable = {
  /** width in px (or CSS string) */
  w?: number | string;
  /** height in px (or CSS string) */
  h?: number | string;
  /** border radius in px (or CSS string) */
  radius?: number | string;
  /** extra sx merged last */
  sx?: SxProps<Theme>;
};

const DEFAULT_W = 138;
const DEFAULT_H = 40;
const DEFAULT_R = 2;

function resolveSx(
  sx: SxProps<Theme> | undefined,
  theme: Theme
): SystemStyleObject<Theme> {
  if (!sx) return {};
  if (typeof sx === 'function') return (sx as (t: Theme) => any)(theme) ?? {};
  if (Array.isArray(sx)) {
    return sx.reduce<SystemStyleObject<Theme>>((acc, item) => {
      const part = resolveSx(item as SxProps<Theme>, theme);
      return { ...acc, ...part };
    }, {});
  }
  return (sx as SystemStyleObject<Theme>) ?? {};
}

const primaryBase = (
  w?: Sizeable['w'],
  h?: Sizeable['h'],
  r?: Sizeable['radius']
): SystemStyleObject<Theme> => ({
  textTransform: 'none',
  backgroundColor: '#6739B7',
  color: '#fff',
  width: w ?? DEFAULT_W,
  height: h ?? DEFAULT_H,
  borderRadius: r ?? DEFAULT_R,
  '&:hover': { backgroundColor: '#522DA8' },
});

const ghostBase = (
  w?: Sizeable['w'],
  h?: Sizeable['h'],
  r?: Sizeable['radius']
): SystemStyleObject<Theme> => ({
  textTransform: 'none',
  color: '#6739B7',
  width: w ?? DEFAULT_W,
  height: h ?? DEFAULT_H,
  borderRadius: r ?? DEFAULT_R,
  '&:hover': { backgroundColor: 'rgba(103,57,183,0.08)' },
});

export type PrimaryButtonProps = Omit<ButtonProps, 'variant' | 'sx'> & Sizeable;
export type GhostButtonProps = Omit<ButtonProps, 'variant' | 'sx'> & Sizeable;

export const PrimaryButton = React.forwardRef<
  HTMLButtonElement,
  PrimaryButtonProps
>(function PrimaryButton({ w, h, radius, sx, ...props }, ref) {
  return (
    <Button
      ref={ref}
      variant="contained"
      sx={(theme) => ({
        ...primaryBase(w, h, radius),
        ...resolveSx(sx, theme),
      })}
      {...props}
    />
  );
});

export const GhostButton = React.forwardRef<
  HTMLButtonElement,
  GhostButtonProps
>(function GhostButton({ w, h, radius, sx, ...props }, ref) {
  return (
    <Button
      ref={ref}
      variant="text"
      sx={(theme) => ({
        ...ghostBase(w, h, radius),
        ...resolveSx(sx, theme),
      })}
      {...props}
    />
  );
});
