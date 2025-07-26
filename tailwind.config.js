// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './newcomponents/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ───────── Brand ───────── */
        primary: {
          DEFAULT: '#6739B7', // Primary
          variant: '#522DA8', // Primary-variant
          light: '#DFD4F3', // Light tint  (≈20 % lighter)
        },
        secondary: {
          DEFAULT: '#03DAC6', // Secondary
          variant: '#018786', // Secondary-variant
          light: '#C4F4F0', // Light tint
        },

        /* ───────── Surface / background ───────── */
        surface: '#FFFFFF',
        background: '#FFFFFF',

        /* ───────── Status colours ───────── */
        status: {
          error: '#D32727', // Error / Denied
          errorLt: '#F8D7DA',
          pending: '#F2A900',
          pendingLt: '#FBF1CF',
          approved: '#22884C',
          approvedLt: '#D3E9DA',
        },

        /* ───────── “On” colours (text/icon on coloured bg) ───────── */
        on: {
          primary: '#FFFFFF',
          secondary: '#FFFFFF',
          background: '#000000',
          surface: '#000000',
          status: '#FFFFFF',
        },
      },
      fontSize: {
        h1: [
          '96px',
          { letterSpacing: '-1.5px', fontWeight: '300', lineHeight: '1' },
        ],
        h2: [
          '60px',
          { letterSpacing: '-0.3px', fontWeight: '300', lineHeight: '1.1' },
        ],
        h3: [
          '48px',
          { letterSpacing: '0', fontWeight: '400', lineHeight: '1.15' },
        ],
        h4: [
          '34px',
          { letterSpacing: '0.085px', fontWeight: '400', lineHeight: '1.2' },
        ],
        h5: [
          '24px',
          { letterSpacing: '0', fontWeight: '400', lineHeight: '1.25' },
        ],
        h6: [
          '20px',
          { letterSpacing: '0.03px', fontWeight: '500', lineHeight: '1.3' },
        ],
        subtitle1: ['16px', { letterSpacing: '0.024px', fontWeight: '400' }],
        subtitle2: ['14px', { letterSpacing: '0.014px', fontWeight: '500' }],
        body1: ['16px', { letterSpacing: '0.08px', fontWeight: '400' }],
        body2: ['14px', { letterSpacing: '0.035px', fontWeight: '400' }],
        button: ['14px', { letterSpacing: '0.175px', fontWeight: '500' }],
        caption: ['12px', { letterSpacing: '0.048px', fontWeight: '400' }],
        overline: ['10px', { letterSpacing: '0.15px', fontWeight: '400' }],
      },

      /*  ── Shadow tokens ─────────────────────────────────────────── */
      boxShadow: {
        xs: '0 1px 2px 0 oklch(20.99% 0.034 263.44 / 0.05)',
        sm: '0 1px 3px 0 oklch(20.99% 0.034 263.44 / 0.10), 0 1px 2px 0 oklch(20.99% 0.034 263.44 / 0.06)',
        md: '0 4px 8px -2px oklch(20.99% 0.034 263.44 / 0.10), 0 2px 4px -2px oklch(20.99% 0.034 263.44 / 0.06)',
        lg: '0 12px 16px -4px oklch(20.99% 0.034 263.44 / 0.08), 0 4px 6px -2px oklch(20.99% 0.034 263.44 / 0.03)',
        xl: '0 20px 24px -6px oklch(20.99% 0.034 263.44 / 0.08), 0 8px 8px -4px oklch(20.99% 0.034 263.44 / 0.03)',
        '2xl': '0 24px 48px -12px oklch(20.99% 0.034 263.44 / 0.18)',
        '3xl': '0 32px 54px -12px oklch(20.99% 0.034 263.44 / 0.14)',
      },
    },
  },
  plugins: [],
};
