import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Container } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import ResearchModal from '@/components/Research/Modal';
import ProjectCard from '@/components/Research/ProjectCard';
import FacultyApplicantsView from '@/components/Research/FacultyApplicantsView';
import {
  collection,
  where,
  query,
  documentId,
  getDocs,
} from 'firebase/firestore';
import firebase from '@/firebase/firebase_config';

interface FacultyResearchViewProps {
  researchListings: any[];
  role: string;
  uid: string;
  getResearchListings: () => void;
  postNewResearchPosition: (formData: any) => Promise<void>;
}

const getResearchApplicationsListings = async (researchListing: any) => {
  const applicationsIds = researchListing.applications || [];
  if (applicationsIds.length === 0) {
    return [];
  }
  const db = firebase.firestore();
  const q = query(
    collection(db, 'research-applications'),
    where(documentId(), 'in', applicationsIds)
  );
  try {
    const querySnapshot = await getDocs(q);
    const applicationsList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return applicationsList;
  } catch (error) {
    console.error('Error retrieving documents:', error);
  }
  return [];
};

const FacultyResearchView: React.FC<FacultyResearchViewProps> = ({
  researchListings,
  role,
  uid,
  getResearchListings,
  postNewResearchPosition,
}) => {
  const [studentView, showStudentView] = useState(true);
  const [selectedResearchId, setSelectedResearchId] = useState<string | null>(null);

  const handleBackToListings = () => {
    setSelectedResearchId(null);
  };

  return (
    <>
      <HeaderCard text="Applications" />
      <Container 
        maxWidth="xl"
        sx={{
          marginTop: '380px',
          paddingBottom: '80px',
          px: { xs: '4%', sm: '6%', md: '8%' }
        }}
      >
        {/* Top section with Research title and Toggle button on the same line */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Typography variant="h4" sx={{ my: 0 }}>Research</Typography>
          
          <Button
            variant="outlined"
            onClick={() => showStudentView(!studentView)}
            sx={{ 
              height: '40px',
              width: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <VisibilityIcon fontSize="small" />
            {studentView ? 'View All Postings' : 'View My Postings'}
          </Button>
        </Box>
        
        {selectedResearchId ? (
          <FacultyApplicantsView
            id={selectedResearchId}
            researchListing={researchListings.find(
              (listing) => listing.id === selectedResearchId
            )}
            researchApplications={getResearchApplicationsListings}
            onBack={handleBackToListings}
          />
        ) : (
          <>
            {/* Second row with "All Postings"/"My Postings" text and Create button */}
            <Box 
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 4,
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {studentView ? 'My Postings' : 'All Postings'}
              </Typography>
              
              <ResearchModal
                uid={uid}
                onSubmitSuccess={getResearchListings}
                firebaseQuery={postNewResearchPosition}
                buttonText={
                  <>
                    Create New Position 
                    <AddIcon sx={{ ml: 1, fontSize: '20px' }} />
                  </>
                }
                currentFormData={{
                  id: '',
                  project_title: '',
                  department: '',
                  faculty_mentor: '',
                  phd_student_mentor: '',
                  terms_available: '',
                  student_level: '',
                  prerequisites: '',
                  credit: '',
                  stipend: '',
                  application_requirements: '',
                  application_deadline: '',
                  website: '',
                  project_description: '',
                }}
                buttonStyle={{
                  height: '40px',
                  minWidth: '200px',
                  backgroundColor: '#5A41D8',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  borderRadius: '4px',
                  boxShadow: '0px 0px 8px #E5F0DC',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: '#5A41D8',
                    boxShadow: '0px 0px 8px #E5F0DC',
                  },
                }}
              />
            </Box>

            {/* Cards Grid */}
            <Grid container spacing={3}>
              {studentView ? (
                researchListings
                  .filter((item) => item.faculty_members?.includes(uid))
                  .map((item, index) => (
                    <Grid item xs={12} sm={12} md={6} lg={6} key={index}>
                      <ProjectCard
                        userRole={role}
                        uid={uid}
                        project_title={item.project_title}
                        department={item.department}
                        faculty_mentor={item.faculty_mentor}
                        terms_available={Object.keys(item.terms_available)
                          .filter(
                            (key) =>
                              item.terms_available[
                                key as keyof typeof item.terms_available
                              ]
                          )
                          .join(', ')}
                        student_level={Object.keys(item.student_level)
                          .filter(
                            (key) =>
                              item.student_level[
                                key as keyof typeof item.student_level
                              ]
                          )
                          .join(', ')}
                        project_description={item.project_description}
                        faculty_members={item.faculty_members}
                        phd_student_mentor={item.phd_student_mentor}
                        prerequisites={item.prerequisites}
                        credit={item.credit}
                        stipend={item.stipend}
                        application_requirements={item.application_requirements}
                        application_deadline={item.application_deadline}
                        website={item.website}
                        onShowApplications={() => {
                          setSelectedResearchId(item.id);
                        }}
                        listingId={item.id}
                      />
                    </Grid>
                  ))
              ) : (
                researchListings.map((item, index) => (
                  <Grid item xs={12} sm={12} md={6} lg={6} key={index}>
                    <ProjectCard
                      userRole={role}
                      uid={uid}
                      project_title={item.project_title}
                      department={item.department}
                      faculty_mentor={item.faculty_mentor}
                      terms_available={Object.keys(item.terms_available)
                        .filter(
                          (key) =>
                            item.terms_available[
                              key as keyof typeof item.terms_available
                            ]
                        )
                        .join(', ')}
                      student_level={Object.keys(item.student_level)
                        .filter(
                          (key) =>
                            item.student_level[
                              key as keyof typeof item.student_level
                            ]
                        )
                        .join(', ')}
                      project_description={item.project_description}
                      faculty_members={item.faculty_members}
                      phd_student_mentor={item.phd_student_mentor}
                      prerequisites={item.prerequisites}
                      credit={item.credit}
                      stipend={item.stipend}
                      application_requirements={item.application_requirements}
                      application_deadline={item.application_deadline}
                      website={item.website}
                      onShowApplications={() => {
                        setSelectedResearchId(item.id);
                      }}
                      listingId={item.id}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          </>
        )}
      </Container>
    </>
  );
};

export default FacultyResearchView;
