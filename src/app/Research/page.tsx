'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { getNavItems } from '@/hooks/useGetItems';
import PageLayout from '@/components/PageLayout/PageLayout';
import StudentResearchView from '@/components/Research/StudentResearchView';
import FacultyResearchView from '@/components/Research/FacultyResearchView';
import { ResearchListing } from '@/app/models/ResearchModel';
import {
  fetchResearchListings,
  createResearchListing,
} from '@/services/researchService';

const ResearchPage: React.FC = () => {
  const [user, role, loading, error] = useUserInfo();

  const [department, setDepartment] = React.useState('');
  const [studentLevel, setStudentLevel] = React.useState('');
  const [termsAvailable, setTermsAvailable] = React.useState('');
  const [researchListings, setResearchListings] = useState<ResearchListing[]>(
    []
  );

  const getResearchListings = useCallback(async () => {
    try {
      const listings = await fetchResearchListings({
        department,
        studentLevel,
      });
      setResearchListings(listings);
    } catch (error) {
      console.error('Error fetching research listings:', error);
      setResearchListings([]);
    }
  }, [department, studentLevel]);

  const postNewResearchPosition = useCallback(async (formData: any) => {
    try {
      const docId = await createResearchListing(formData);
      console.log('Document written with ID: ', docId);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      getResearchListings();
    }
  }, [user, getResearchListings]);

  if (error) {
    return <p>Error loading role</p>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <p>Please sign in.</p>;
  }

  return (
    <>
      <Toaster />
      <PageLayout
        mainTitle="Research Applications"
        navItems={getNavItems(role)}
      >
        {(role === 'student_applying' || role === 'student_applied') && (
          <StudentResearchView
            researchListings={researchListings}
            role={role}
            uid={user.uid}
            department={department}
            setDepartment={setDepartment}
            studentLevel={studentLevel}
            setStudentLevel={setStudentLevel}
            getResearchListings={getResearchListings}
            setResearchListings={setResearchListings}
            termsAvailable={termsAvailable}
            setTermsAvailable={setTermsAvailable}
          />
        )}
        {role === 'faculty' && (
          <FacultyResearchView
            researchListings={researchListings}
            role={role}
            uid={user.uid}
            getResearchListings={getResearchListings}
            postNewResearchPosition={postNewResearchPosition}
          />
        )}
        {role === 'admin' && (
          <FacultyResearchView
            researchListings={researchListings}
            role={role}
            uid={user.uid}
            getResearchListings={getResearchListings}
            postNewResearchPosition={postNewResearchPosition}
            isAdmin
          />
        )}
      </PageLayout>
    </>
  );
};

export default ResearchPage;
