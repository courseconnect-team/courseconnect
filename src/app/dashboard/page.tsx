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

// user information reference: https://firebase.google.com/docs/auth/web/manage-users

export default function Dashboard() {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);
  const [activeComponent, setActiveComponent] = React.useState('welcome');

  const handleComponentChange = (componentName: string) => {
    setActiveComponent(componentName);
  };

  if ((user && user.emailVerified) || (user && role === 'admin')) {
    return (
      <>
        <Toaster />
        {activeComponent === 'welcome' && (
          <DashboardWelcome user={user} userRole={role as string} />
        )}
        {activeComponent === 'profile' && (
          <Profile user={user} userRole={role as string} />
        )}
        {activeComponent === 'users' && <Users userRole={role as string} />}
        {activeComponent === 'courses' && <Courses userRole={role as string} />}
        {activeComponent === 'applications' && (
          <Applications userRole={role as string} />
        )}
        {activeComponent === 'application' && <Application />}
        {activeComponent === 'application_status' && (
          <ShowApplicationStatus user={user} userRole={role as string} />
        )}
        {/*<BottomMenu
          user_role={role as string}
          onComponentChange={handleComponentChange}
        />*/}
      </>
    );
  } else if (user && !user.emailVerified) {
    return (
      <>
        <h1>Email Verification Required</h1>
        <p>Please check your email for a verification link.</p>
      </>
    );
  }
}
