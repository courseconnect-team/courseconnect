'use client';
import React, { useEffect, useState, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Box, Tabs, Tab } from '@mui/material';
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
  const [activeTab, setActiveTab] = useState(0);

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
      toast.error('Failed to load research listings.');
      setResearchListings([]);
    }
  }, [department, studentLevel]);

  const postNewResearchPosition = useCallback(async (formData: any) => {
    const docId = await createResearchListing(formData);
    console.log('Document written with ID: ', docId);
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

  const isFacultyOrAdmin = role === 'faculty' || role === 'admin';

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
        {isFacultyOrAdmin && (
          <>
            <Box
              sx={{
                display: 'inline-flex',
                p: 0.5,
                mb: 3,
                backgroundColor: '#F4F1FC',
                borderRadius: '999px',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                TabIndicatorProps={{ sx: { display: 'none' } }}
                sx={{
                  minHeight: 'auto',
                  '& .MuiTabs-flexContainer': { gap: 0.5 },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    minHeight: 36,
                    py: 0.75,
                    px: 2.5,
                    borderRadius: '999px',
                    color: '#6B5AA8',
                    transition: 'all 0.15s ease',
                  },
                  '& .Mui-selected': {
                    color: '#fff !important',
                    backgroundColor: '#5A41D8',
                    boxShadow: '0 4px 12px rgba(90, 65, 216, 0.24)',
                  },
                }}
              >
                <Tab label="My Positions" />
                <Tab label="Research Board" />
              </Tabs>
            </Box>
            {activeTab === 0 && (
              <FacultyResearchView
                researchListings={researchListings}
                role={role}
                uid={user.uid}
                getResearchListings={getResearchListings}
                postNewResearchPosition={postNewResearchPosition}
                isAdmin={role === 'admin'}
              />
            )}
            {activeTab === 1 && (
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
          </>
        )}
      </PageLayout>
    </>
  );
};

export default ResearchPage;
