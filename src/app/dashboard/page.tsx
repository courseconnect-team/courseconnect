'use client';
import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import BottomMenu from '@/components/BottomMenu/BottomMenu';
// user information reference: https://firebase.google.com/docs/auth/web/manage-users

export default function Dashboard() {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);

  if (user) {
    return (
      <>
        <h1>
          Welcome to the dashboard, {role as string} {user?.email}!
        </h1>
        <BottomMenu user_role={role as string} />
      </>
    );
  }
}
