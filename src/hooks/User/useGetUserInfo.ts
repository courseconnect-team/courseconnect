import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import GetAnnouncementTimestamp from '@/firebase/util/GetAnnouncementTimestamp';
import GetUserName from '@/firebase/util/GetUserName';

export const useUserInfo = () => {
  const { user } = useAuth();

  const [role, loadingRole, errorRole] = GetUserRole(user?.uid);
  const name = GetUserName(user?.uid); // "First Last"

  const parts = name.split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts[parts.length - 1] : '';


  return {
    user,
    role,
    firstName,
    lastName,
    loading: loadingRole || !name, // wait for name to load
    error: errorRole,
  };
};

export const useUserTimestamp = () => {
  const { user } = useAuth();
  const [timestamp, loading, error] = GetAnnouncementTimestamp(user?.uid);

  return [user, timestamp, loading, error];
};
