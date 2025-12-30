'use client';

import { getNavItems, getCourses } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import PageLayout from '@/components/PageLayout/PageLayout';
import { FC, useEffect, useState } from 'react';
import CourseSections from './courseSections';
import Application from '../../oldPages/Apply/inacessible';

interface pageProps {}
const CoursesPage: FC<pageProps> = () => {
  const [user, role, loading, error] = useUserInfo();
  const uemail = user?.email;

  // ② handle loading / error
  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading user info</div>;
  if (role !== 'faculty' && role !== 'admin') return <div> Forbidden </div>;
  return (
    <PageLayout mainTitle="Courses" navItems={getNavItems(role)}>
      <CourseSections role={role} uemail={uemail} navItems={getCourses(role)} />
    </PageLayout>
  );
};
export default CoursesPage;
