'use client';

import * as React from 'react';
import { Toaster } from 'react-hot-toast';
import CssBaseline from '@mui/material/CssBaseline';

import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import PageLayout from '@/components/PageLayout/PageLayout';
import { getNavItems } from '@/hooks/useGetItems';
import AdminStats from '@/components/Dashboard/AdminStats/AdminStats';

export default function AdminStatsPage() {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading role</div>;
  if (role !== 'admin') return <div>Forbidden</div>;

  return (
    <PageLayout mainTitle="Admin Dashboard" navItems={getNavItems(role)}>
      <CssBaseline />
      <Toaster />
      <AdminStats />
    </PageLayout>
  );
}
