// little message welcoming user to dashboard, inviting user to explore and click stuff
// include user name or something here
import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';

export default function DashboardWelcome() {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);

  return (
    <>
      <h1>
        Welcome, {role as string} {user?.email}!
      </h1>
    </>
  );
}
