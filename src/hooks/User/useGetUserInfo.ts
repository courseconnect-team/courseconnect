import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';

export const useUserInfo = () => {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);

  return [user, role, loading, error];
};

