import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import GetAnnouncementTimestamp from '@/firebase/util/GetAnnouncementTimestamp';

export const useUserInfo = () => {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);
  return [user, role, loading, error];
};

export const useUserTimestamp = () => {
  const { user } = useAuth();
  const [timestamp, loading, error] = GetAnnouncementTimestamp(user?.uid);
  return [user, timestamp, loading, error];
};
