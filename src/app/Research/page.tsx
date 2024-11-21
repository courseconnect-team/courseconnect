'use client';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { Bio } from '@/components/Bio/Bio';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useUserRole } from '@/firebase/util/GetUserRole';
interface ResearchPageProps {
  user: {
    uid: string;
    fullName: string;
    bio: string;
  };
}

const ResearchPage: React.FC<ResearchPageProps> = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const {
    role,
    loading: roleLoading,
    error: roleError,
  } = useUserRole(user?.uid);

  if (roleError) {
    return <p>Error loading role</p>;
  }

  if (!user) {
    return <p>Please sign in.</p>;
  }
  return (
    <>
      <Toaster />
      <HeaderCard text="Research Job Board" />
      <div className="page-container">
        {role === 'faculty' && (
          <div className="faculty-component">
            {/* Replace this with your actual component */}
            <h2>Welcome, Faculty Member!</h2>
            <p>
              Here you can manage your research activities and collaborations.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default ResearchPage;
