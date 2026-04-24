'use client';

import { getNavItemsForUser } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DashboardSections from './DashboardSections';
import PageLayout from '@/components/PageLayout/PageLayout';
import { FC } from 'react';
import { Role } from '@/types/User';
interface pageProps {}
const NewDashboard: FC<pageProps> = () => {
  const [user, role, loading, error] = useUserInfo();
  const { user: currentUser } = useCurrentUser();

  // ② handle loading / error
  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading user info</div>;

  // Super admin without a secondary role would otherwise render nothing
  // (DashboardSections and getNavItems both switch on role). Promote them
  // to the admin rendering path for UI purposes; real authority still
  // flows through the superAdmin flag on role-gated operations.
  const effectiveRole: Role = currentUser.superAdmin ? 'admin' : role;
  const navItems = getNavItemsForUser({
    role: effectiveRole,
    superAdmin: currentUser.superAdmin,
  });

  return (
    <PageLayout mainTitle="Dashboard" navItems={navItems}>
      <DashboardSections navItems={navItems} role={effectiveRole} />
    </PageLayout>
  );
};
export default NewDashboard;
