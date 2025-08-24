'use client';
import React from 'react';
import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import BottomMenu from '@/components/BottomMenu/BottomMenu';

// dashboard components
import DashboardWelcome from '@/components/Dashboard/Welcome/Welcome';
import Profile from '@/components/Dashboard/Profile/Profile';
import Users from '@/components/Dashboard/Users/Users';
import Courses from '@/components/Dashboard/Courses/Courses';
import Applications from '@/components/Dashboard/Applications/Applications';
import Application from '@/components/Dashboard/Applications/Application';
import ShowApplicationStatus from '@/components/Dashboard/Applications/AppStatus';
import { Toaster } from 'react-hot-toast';
import { TopNavBarSigned } from '@/components/TopNavBarSigned/TopNavBarSigned';

// user information reference: https://firebase.google.com/docs/auth/web/manage-users

export default function Dashboard() {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);
  const [activeComponent, setActiveComponent] = React.useState('welcome');

  const handleComponentChange = (componentName: string) => {
    setActiveComponent(componentName);
  };

  return (
    <>
      <Toaster />
      <DashboardWelcome user={user} userRole={role as string} emailVerified={user.emailVerified} />
    </>
  );
}
