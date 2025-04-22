import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import ResearchModal from '@/components/Research/Modal';
import ProjectCard from '@/components/Research/ProjectCard';
import FacultyApplicantsView from '@/components/Research/FacultyApplicantsView';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  where,
  query,
  documentId,
  getDocs,
} from 'firebase/firestore';
import firebase from '@/firebase/firebase_config';
import EditResearchModal from './EditResearchModal';

interface FacultyResearchViewProps {
  researchListings: any[];
  role: string;
  uid: string;
  getResearchListings: () => void;
  postNewResearchPosition: (formData: any) => Promise<void>;
}

const FacultyResearchView: React.FC<FacultyResearchViewProps> = ({
  researchListings,
  role,
  uid,
  getResearchListings,
  postNewResearchPosition,
}) => {
  const [studentView, showStudentView] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<any | null>(null);

  const [selectedResearchId, setSelectedResearchId] = useState<string | null>(
    null
  );

  // Callback to go back to the research listings view
  const handleBackToListings = () => {
    setSelectedResearchId(null);
  };
  return (
    <>
      <HeaderCard text="Applications" />
      <Box sx={{ p: 3 }}>
        {/* Top-level heading */}
        <Typography variant="h4" gutterBottom>
          Research
        </Typography>
        {selectedResearchId ? (
          <Box
            marginTop="380px"
            justifyContent="space-between"
            display="flex"
            flexWrap="wrap"
          >
            <FacultyApplicantsView
              id={selectedResearchId}
              researchListing={researchListings.find(
                (listing) => listing.id === selectedResearchId
              )}
              onBack={handleBackToListings}
            />
          </Box>
        ) : (
          <>
            {/* Container for "My Positions" and the button */}
            <Box
              marginTop="380px"
              justifyContent="space-between"
              display="flex"
              flexWrap="wrap"
            >
              <Box>
                {/* Left side: "My Positions" and link/label */}
                <Typography variant="h6" gutterBottom>
                  My Positions:
                </Typography>
                {/* Center: "Research Board View" Button */}
                <Button
                  sx={{
                    backgroundColor: '#5A41D8', // Same purple as Edit Application
                    color: '#FFFFFF', // White text
                    textTransform: 'none', // Keep text normal case
                    borderRadius: '8px', // Rounded corners
                    boxShadow: '0px 0px 8px #E5F0DC', // Subtle greenish glow
                    fontWeight: 500,
                    padding: '10px 24px',
                    marginBottom: '16px', // Add vertical space below the button
                    '&:hover': {
                      backgroundColor: '#5A41D8', // Keep hover consistent
                      boxShadow: '0px 0px 8px #E5F0DC',
                    },
                  }}
                  onClick={() => showStudentView(!studentView)}
                >
                  {studentView
                    ? 'Switch to Student View'
                    : 'Switch to Default View'}
                </Button>
              </Box>

              <ResearchModal
                uid={uid}
                onSubmitSuccess={getResearchListings}
                firebaseQuery={postNewResearchPosition}
                buttonText="Create New Position"
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
                  backgroundColor: '#5A41D8', // Same purple as Edit Application
                  color: '#FFFFFF', // White text
                  textTransform: 'none', // Keep text normal case
                  borderRadius: '8px', // Rounded corners
                  boxShadow: '0px 0px 8px #E5F0DC', // Subtle greenish glow
                  fontWeight: 500,
                  padding: '10px 24px',
                  '&:hover': {
                    backgroundColor: '#5A41D8', // Keep hover consistent
                    boxShadow: '0px 0px 8px #E5F0DC',
                  },
                }}
              />
              {/* Conditional rendering based on state */}
              {studentView ? (
                <Grid container spacing={4} mt={3} mx="5%">
                  {researchListings
                    .filter((item) => item.faculty_members?.includes(uid))
                    .map((item, index) => (
                      <Grid item xs={12} sm={6} md={6} key={index}>
                        <ProjectCard
                          listingId={item.docID}
                          userRole={role}
                          uid={uid}
                          project_title={item.project_title}
                          department={item.department}
                          faculty_mentor={item.faculty_mentor}
                          terms_available={item.terms_available}
                          student_level={item.student_level}
                          project_description={item.project_description}
                          faculty_members={item.faculty_members}
                          phd_student_mentor={item.phd_student_mentor}
                          prerequisites={item.prerequisites}
                          credit={item.credit}
                          stipend={item.stipend}
                          application_requirements={
                            item.application_requirements
                          }
                          application_deadline={item.application_deadline}
                          website={item.website}
                          onShowApplications={() => {
                            setSelectedResearchId(item.id);
                          }}
                          onEdit={() => {
                            console.log('Opening edit modal');
                            setEditingForm(item);
                            setEditModalOpen(true);
                          }}
                        />
                      </Grid>
                    ))}
                </Grid>
              ) : (
                <Grid container spacing={4} mt={3} mx="5%">
                  {researchListings.map((item, index) => (
                    <Grid item xs={12} sm={6} md={6} key={index}>
                      <ProjectCard
                        listingId={item.id}
                        userRole={role}
                        uid={uid}
                        project_title={item.project_title}
                        department={item.department}
                        faculty_mentor={item.faculty_mentor}
                        terms_available={item.terms_available}
                        student_level={item.student_level}
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
                        onEdit={() => {
                          console.log('Opening edit modal');
                          setEditingForm(item);
                          setEditModalOpen(true);
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </>
        )}
      </Box>
      {editingForm && (
        <EditResearchModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          listingData={editingForm}
          onSubmitSuccess={getResearchListings}
        />
      )}
    </>
  );
};

export default FacultyResearchView;
