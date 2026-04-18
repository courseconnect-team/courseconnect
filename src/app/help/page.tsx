'use client';

import { FC } from 'react';
import PageLayout from '@/components/PageLayout/PageLayout';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { getNavItems } from '@/hooks/useGetItems';
import HelpView from './HelpView';

const HelpPage: FC = () => {
  const [user, role, loading, error] = useUserInfo();

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading user info</div>;

  return (
    <PageLayout mainTitle="Help Center" navItems={getNavItems(role)}>
      <HelpView role={role} />
    </PageLayout>
  );
};

export default HelpPage;
