'use client';

import { getNavItems, getApplications } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import PageLayout from '@/components/PageLayout/PageLayout';
import { FC } from 'react';
import ApplicationSections from './applicationSections';

ApplicationSections;
interface pageProps {}
const ApplicationPage: FC<pageProps> = () => {
  const [user, role, loading, error] = useUserInfo();
  const uemail = user?.email;
  // ② handle loading / error
  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading user info</div>;

  return (
    <PageLayout mainTitle="Applications" navItems={getNavItems(role)}>
      <ApplicationSections
        role={role}
        uemail={uemail}
        navItems={getApplications(role)}
      />
    </PageLayout>
  );
};
export default ApplicationPage;
