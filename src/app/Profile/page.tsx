'use client';

import PageLayout from '@/newcomponents/PageLayout/PageLayout';
import { FC, useEffect, useState } from 'react';
import { getNavItems } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import ProfileSection from './profileSections';
interface pageProps {}

const ProfilePage: FC<pageProps> = () => {
  const [user, role, loading, error] = useUserInfo();
  //   const nameSplit = user.displayName.split(' ');
  //   const firstName = nameSplit[0] || '';
  //   const lastName = nameSplit.slice(1).join(' ');
  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading user info</div>;
  return (
    <PageLayout mainTitle="User Profile" navItems={getNavItems(role)}>
      <ProfileSection
        user={user}
        role={role}
        name={user.displayName}
        email={user.email}
      />
    </PageLayout>
  );
};
export default ProfilePage;
