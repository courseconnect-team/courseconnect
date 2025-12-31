'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import firebase from '../firebase_config';
import { isE2EMode, getE2EUser } from '@/utils/featureFlags';

const auth = firebase.auth();
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isE2EMode()) {
      const stubUser = getE2EUser();
      setUser(stubUser);
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);

      if (
        !user &&
        pathname !== '/' &&
        pathname !== '/signup' &&
        pathname != '/signin' &&
        pathname !== '/about' &&
        pathname !== '/features'
      ) {
        router.push('/');
      }
      if (
        user &&
        (pathname === '/' || pathname === '/signup' || pathname === '/signin')
      ) {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
    // run once to avoid re-entrant updates during tests
  }, [pathname, router]);

  const value = {
    user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
