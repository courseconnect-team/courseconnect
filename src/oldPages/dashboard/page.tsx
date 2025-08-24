'use client';
import React from 'react';
import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import BottomMenu from '@/component/BottomMenu/BottomMenu';

// dashboard components
import DashboardWelcome from '@/component/Dashboard/Welcome/Welcome';
import Profile from '@/component/Dashboard/Profile/Profile';
import Users from '@/component/Dashboard/Users/Users';
import Courses from '@/component/Dashboard/Courses/Courses';
import Applications from '@/component/Dashboard/Applications/Applications';
import Application from '@/component/Dashboard/Applications/Application';
import ShowApplicationStatus from '@/component/Dashboard/Applications/AppStatus';
import { Toaster } from 'react-hot-toast';
import { TopNavBarSigned } from '@/component/TopNavBarSigned/TopNavBarSigned';

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
