'use client';
import UserDisplay from '@/components/UserDisplay';
import SignOutButton from '@/components/SignOut/SignOutButton';

import { useAuth } from '@/firebase/auth/auth_context';
// user information reference: https://firebase.google.com/docs/auth/web/manage-users

export default function Dashboard() {
  const { user } = useAuth();

  if (user) {
    return (
      <>
        <h1>Dashboard page</h1>
        <h2>Welcome, {user?.email}!</h2>
        <SignOutButton />
      </>
    );
  }
}
