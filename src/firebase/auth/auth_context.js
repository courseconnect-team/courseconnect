'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import firebase from '../firebase_config';

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
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);

      // if the user is not authenticated and the current page is not the signin screen, the signup screen, or the about page, then push to './'
      if (
        !user &&
        pathname !== '/' &&
        pathname !== '/signup' &&
        pathname != '/signin' &&
        pathname !== '/about'
      ) {
        router.push('/');
      }
      // if (!user) {
      //   router.push('/'); // Redirect to home page if user is not authenticated
      // }
    });

    return () => unsubscribe();
  }, [router]);

  const value = {
    user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
