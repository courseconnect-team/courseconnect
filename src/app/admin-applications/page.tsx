'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import { useAuth } from '@/firebase/auth/auth_context';
import { Toaster, toast } from 'react-hot-toast';
import GetUserRole from '@/firebase/util/GetUserRole';

import 'firebase/firestore';
import Applications from '@/components/Dashboard/Applications/Applications';
import PageLayout from '@/components/PageLayout/PageLayout';
import { CssBaseline } from '@mui/material';
import { getNavItems } from '@/hooks/useGetItems';

export default function AdminApplications() {
  let { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);
  if (loading) return <div>Loading</div>;
  if (error) return <div>Error loading role</div>;
  if (role !== 'admin') return <div> Forbidden </div>;

  return (
    <PageLayout mainTitle="Applications" navItems={getNavItems(role)}>
      <CssBaseline />
      <Toaster />
      <Applications userRole={role as string} />
    </PageLayout>
  );
}
