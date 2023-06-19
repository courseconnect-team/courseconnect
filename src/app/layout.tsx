'use client';
import { AuthProvider } from '@/firebase/auth/auth_context';
import React, { useEffect } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import darkTheme from './theme/darkTheme';
import lightTheme from './theme/lightTheme';
import Header from '@/components/Header/Header';

const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
});
export const metadata = {
  title: 'Course Connect',
  description: 'Hiring management for students, faculty, and administrators.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = React.useState<'light' | 'dark'>('dark');
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    []
  );

  const darkThemeChosen = React.useMemo(
    () =>
      createTheme({
        ...darkTheme,
      }),
    []
  );
  const lightThemeChosen = React.useMemo(
    () =>
      createTheme({
        ...lightTheme,
      }),
    []
  );

  useEffect(() => {
    // Retrieve the saved theme preference from local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && savedTheme === 'dark') {
      setMode('dark');
    } else {
      setMode('light');
    }
  }, []);

  useEffect(() => {
    // Save the current theme preference to local storage
    localStorage.setItem('theme', mode);
  }, [mode]);

  return (
    <html lang="en">
      <body>
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider
            theme={mode === 'dark' ? darkThemeChosen : lightThemeChosen}
          >
            <AuthProvider>
              <CssBaseline />
              <Header ColorModeContext={ColorModeContext} />
              {children}
            </AuthProvider>
          </ThemeProvider>
        </ColorModeContext.Provider>
      </body>
    </html>
  );
}
