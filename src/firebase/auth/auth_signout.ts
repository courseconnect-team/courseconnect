import firebase from '../firebase_config';
import 'firebase/compat/auth';
import { isE2EMode } from '@/utils/featureFlags';

// Lazily get auth so it doesn't run during import/SSR/build
function getAuth() {
  // If you're using compat (firebase.auth()), keep it consistent.
  // If you use modular SDK, prefer: getAuth(firebaseApp)
  return firebase.auth();
}

export default async function handleSignOut() {
  localStorage.removeItem('selectedSemesters');

  // ✅ E2E stub: do not touch Firebase
  if (isE2EMode()) {
    // optionally clear your own app session markers here
    window.location.assign('/');
    return;
  }

  try {
    // If getAuth() returns compat Auth, firebaseSignOut(auth) may mismatch.
    // Use the same API style consistently:
    const auth = getAuth();

    // If auth is compat: auth.signOut()
    await auth.signOut();

    console.log('User signed out successfully!');
    window.location.assign('/');
  } catch (error: any) {
    console.error('Sign out error:', error?.code, error?.message);
  }
}
