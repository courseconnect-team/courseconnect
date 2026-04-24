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
import { callFunction } from '@/firebase/functions/callFunction';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const LOGIN_RECORDED_KEY = 'cc_login_recorded_uid';
const MATERIALIZE_KEY = 'cc_materialize_pending_uid';

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

// Unit 4 of multi-department support: resolve any pending-memberships invite
// for this user's email on first sign-in of the session. Idempotent server-
// side; the sessionStorage guard just avoids hitting the Cloud Function
// every page navigation. Failure here is non-fatal — the user is still
// signed in; next session retries.
async function materializePendingOnce(user) {
  if (!user || typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(MATERIALIZE_KEY) === user.uid) return;
    sessionStorage.setItem(MATERIALIZE_KEY, user.uid);
    await callFunction('materializePendingMemberships', {});
  } catch (err) {
    console.error('Failed to materialize pending memberships:', err);
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
      if (user) {
        recordLoginOnce(user);
        materializePendingOnce(user);
      }

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
