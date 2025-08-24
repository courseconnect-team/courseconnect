'use client';
import React from 'react';
import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import BottomMenu from '@/componentsd/BottomMenu/BottomMenu';

// dashboard components
import DashboardWelcome from '@/componentsd/Dashboard/Welcome/Welcome';
import Profile from '@/componentsd/Dashboard/Profile/Profile';
import Users from '@/componentsd/Dashboard/Users/Users';
import Courses from '@/componentsd/Dashboard/Courses/Courses';
import Applications from '@/componentsd/Dashboard/Applications/Applications';
import Application from '@/componentsd/Dashboard/Applications/Application';
import ShowApplicationStatus from '@/componentsd/Dashboard/Applications/AppStatus';
import { Toaster } from 'react-hot-toast';
import { TopNavBarSigned } from '@/componentsd/TopNavBarSigned/TopNavBarSigned';

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
      <DashboardWelcome
        user={user}
        userRole={role as string}
        emailVerified={user.emailVerified}
      />
    </>
  );
}
