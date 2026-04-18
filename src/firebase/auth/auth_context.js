'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import firebase from '../firebase_config';
import { isE2EMode, getE2EUser } from '@/utils/featureFlags';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const LOGIN_RECORDED_KEY = 'cc_login_recorded_uid';

async function recordLoginOnce(user) {
  if (!user || typeof window === 'undefined') return;
  try {
    const alreadyRecorded = sessionStorage.getItem(LOGIN_RECORDED_KEY);
    if (alreadyRecorded === user.uid) return;
    sessionStorage.setItem(LOGIN_RECORDED_KEY, user.uid);

    const db = firebase.firestore();
    const serverTs = firebase.firestore.FieldValue.serverTimestamp();
    await db
      .collection('users')
      .doc(user.uid)
      .set(
        {
          lastLogin: serverTs,
          email: user.email ?? null,
        },
        { merge: true }
      );
    await db.collection('login_events').add({
      uid: user.uid,
      email: user.email ?? null,
      timestamp: serverTs,
    });
  } catch (err) {
    console.error('Failed to record login event:', err);
  }
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
    const auth = firebase.auth();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      if (user) recordLoginOnce(user);

      if (
        !user &&
        pathname !== '/' &&
        pathname !== '/signup' &&
        pathname !== '/signin' &&
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
