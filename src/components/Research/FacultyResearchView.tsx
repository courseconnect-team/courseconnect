import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import ResearchModal from '@/components/Research/Modal';
import ProjectCard from '@/components/Research/ProjectCard';
import FacultyApplicantsView from '@/components/Research/FacultyApplicantsView';
import { deleteDoc, doc } from 'firebase/firestore';
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

  // State for delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteDocID, setDeleteDocID] = useState<string | null>(null);

  // Open delete confirmation modal
  const handleOpenDeleteModal = (docID: string) => {
    setDeleteDocID(docID);
    setDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteDocID(null);
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!deleteDocID) return;
    try {
      const db = firebase.firestore();
      const docRef = doc(db, 'research-listings', deleteDocID); // Reference to the document
      await deleteDoc(docRef); // Delete the document
      console.log(`Listing with ID ${deleteDocID} deleted successfully.`);
      getResearchListings(); // Refresh the listings
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      handleCloseDeleteModal(); // Close the modal
    }
  };

  // Get my positions by filtering
  const myPositions = researchListings.filter((item) =>
    item.faculty_members?.includes(uid)
  );

  // Check if there are no positions when in my positions view
  const hasNoPositions = studentView && myPositions.length === 0;

  // Callback to go back to the research listings view
  const handleBackToListings = () => {
    setSelectedResearchId(null);
  };

  return (
    <>

      {/* Use Container for consistent width constraints */}
      <Container
        sx={{
          p: 3,
          mt: '380px',
          mb: 8,
          maxWidth: {
            xs: '100%',
            sm: '95%',
            md: '90%',
            lg: '85%',
            xl: '80%',
          },
          mx: 'auto',
        }}
      >
        {/* Top-level heading */}
        <Typography variant="h4" gutterBottom>
          Research
        </Typography>

        {selectedResearchId ? (
          <Box display="flex" justifyContent="space-between" flexWrap="wrap">
            <FacultyApplicantsView
              id={selectedResearchId}
              researchListing={researchListings.find(
                (listing) => listing.docID === selectedResearchId
              )}
              onBack={handleBackToListings}
            />
          </Box>
        ) : (
          <>
            {/* Header section with buttons - consistent width */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={4}
            >
              <Box>
                {/* Left side: "My Positions" and button */}
                <Typography variant="h6" gutterBottom>
                  My Positions:
                </Typography>
                <Button
                  sx={{
                    backgroundColor: '#5A41D8',
                    color: '#FFFFFF',
                    textTransform: 'none',
                    borderRadius: '8px',
                    boxShadow: '0px 0px 8px #E5F0DC',
                    fontWeight: 500,
                    padding: '10px 24px',
                    marginBottom: '16px',
                    '&:hover': {
                      backgroundColor: '#4A35B8',
                      boxShadow: '0px 0px 12px #E5F0DC',
                    },
                  }}
                  onClick={() => showStudentView(!studentView)}
                >
                  {studentView ? 'View all Positions' : 'View my Positions'}
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
                  faculty_mentor: {},
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
                  backgroundColor: '#5A41D8',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  borderRadius: '8px',
                  boxShadow: '0px 0px 8px #E5F0DC',
                  fontWeight: 500,
                  padding: '10px 24px',
                  '&:hover': {
                    backgroundColor: '#4A35B8',
                    boxShadow: '0px 0px 12px #E5F0DC',
                  },
                }}
              />
            </Box>

            {hasNoPositions ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  py: 10,
                  px: 3,
                  backgroundColor: '#f9f9f9',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h5" sx={{ mb: 2, color: '#555' }}>
                  No research positions found
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, maxWidth: 600 }}>
                  You haven&apos;t created any research positions yet. Get
                  started by creating your first position using the &quot;Create
                  New Position&quot; button above.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={4}>
                {studentView
                  ? myPositions.map((item, index) => (
                      <Grid item xs={12} md={12} lg={6} key={index}>
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
                            setSelectedResearchId(item.docID);
                          }}
                          onEdit={() => {
                            console.log('Opening edit modal');
                            setEditingForm(item);
                            setEditModalOpen(true);
                          }}
                          onDelete={() => handleOpenDeleteModal(item.docID)} // Open confirmation modal
                        />
                      </Grid>
                    ))
                  : researchListings.map((item, index) => (
                      <Grid item xs={12} md={12} lg={6} key={index}>
                        <ProjectCard
                          listingId={item.id || item.docID}
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
                            setSelectedResearchId(item.docID);
                          }}
                          onEdit={() => {
                            console.log('Opening edit modal');
                            setEditingForm(item);
                            setEditModalOpen(true);
                          }}
                          onDelete={() => handleOpenDeleteModal(item.docID)} // Open confirmation modal
                        />
                      </Grid>
                    ))}
              </Grid>
            )}
          </>
        )}
      </Container>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        aria-labelledby="delete-confirmation-title"
        aria-describedby="delete-confirmation-description"
      >
        <DialogTitle id="delete-confirmation-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-confirmation-description">
            Are you sure you want to delete this research listing? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteModal}
            sx={{
              color: '#5A41D8',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(90, 65, 216, 0.04)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            sx={{
              backgroundColor: '#5A41D8',
              color: '#FFFFFF',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#4A35B8',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
