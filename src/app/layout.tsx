'use client';
import { AuthProvider } from '@/firebase/auth/auth_context';
import { AnnouncementsProvider } from '@/contexts/AnnouncementsContext';
import React, { useEffect } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import darkTheme from './theme/darkTheme';
import lightTheme from './theme/lightTheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase/auth/auth_context';

const queryClient = new QueryClient();

const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  // Only protect private routes
  const isProtectedRoute = !['/signup', '/login', '/about', '/'].includes(
    window.location.pathname
  );

  useEffect(() => {
    if (isProtectedRoute && user === null) {
      router.push('/');
    }
  }, [user, router, isProtectedRoute]);

  if (isProtectedRoute && typeof user === 'undefined')
    return <div>Loading...</div>;
  if (isProtectedRoute && user === null) return null;

  return <>{children}</>;
}

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
        <QueryClientProvider client={queryClient}>
          <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider
              theme={mode === 'dark' ? darkThemeChosen : lightThemeChosen}
            >
              <AuthProvider>
                <CssBaseline />
                {/*<Header ColorModeContext={ColorModeContext} />*/}
                <AuthGate>{children}</AuthGate>
              </AuthProvider>
            </ThemeProvider>
          </ColorModeContext.Provider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
