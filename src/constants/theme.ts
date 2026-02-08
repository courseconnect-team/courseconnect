/**
 * Theme and UI constants for CourseConnect
 */

// Brand colors
export const COLORS = {
  // Primary colors
  primary: '#5A41D8',
  primaryDark: '#4A35B8',
  primaryLight: '#6B52E9',

  // Secondary colors
  secondary: '#03ccb9',
  secondaryDark: '#01534B',

  // Accent colors
  success: '#4caf50',
  error: '#F44336',
  warning: '#ff9800',
  info: '#2196f3',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Background colors
  background: {
    default: '#FFFFFF',
    paper: '#F5F5F5',
  },

  // Text colors
  text: {
    primary: '#000000',
    secondary: '#757575',
    disabled: '#bdbdbd',
  },
} as const;

// Border radius values
export const BORDER_RADIUS = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  round: '9999px',
} as const;

// Spacing values (in pixels)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Common Material-UI sx styles
export const COMMON_SX = {
  // Card styles
  card: {
    borderRadius: BORDER_RADIUS.xl,
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    backgroundColor: COLORS.white,
  },

  // Button styles
  primaryButton: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: COLORS.primaryDark,
    },
  },

  outlinedButton: {
    borderColor: COLORS.primary,
    color: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    textTransform: 'none',
    borderWidth: '2px',
    '&:hover': {
      borderWidth: '2px',
      backgroundColor: 'rgba(90, 65, 216, 0.04)',
    },
  },

  // Section header styles
  sectionHeader: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: COLORS.text.primary,
    mb: 2,
  },
} as const;

// Grid breakpoints (Material-UI standard)
export const GRID_BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

// Common grid sizes
export const GRID_SIZES = {
  full: 12,
  half: 6,
  third: 4,
  quarter: 3,
} as const;

// Z-index layers
export const Z_INDEX = {
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
} as const;

// Animation durations (in ms)
export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;
