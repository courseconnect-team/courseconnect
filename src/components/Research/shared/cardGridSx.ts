import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Fits as many columns of at least 300px as the available width allows, so
 * zooming in moves cards to a new row instead of clipping them. Viewport
 * breakpoints can't do this because they ignore the side nav and page padding.
 *
 * @param spacing gap between cards, in MUI spacing units
 */
export function cardGridSx(spacing: number): SxProps<Theme> {
  return {
    display: 'grid',
    gap: spacing,
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
  };
}
