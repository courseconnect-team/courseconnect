import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ResearchModal from '@/components/Research/Modal';
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
  isAdmin?: boolean;
}

const FacultyResearchView: React.FC<FacultyResearchViewProps> = ({
  researchListings,
  role,
  uid,
  getResearchListings,
  postNewResearchPosition,
  isAdmin = false,
}) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<any | null>(null);
  const [selectedResearchId, setSelectedResearchId] = useState<string | null>(
    null
  );
  const [selectedSemester, setSelectedSemester] = useState('Spring 2026');
  const [showAll, setShowAll] = useState(false);

  // State for delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteDocID, setDeleteDocID] = useState<string | null>(null);

  const handleOpenDeleteModal = (docID: string) => {
    setDeleteDocID(docID);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteDocID(null);
  };

  const handleDelete = async () => {
    if (!deleteDocID) return;
    try {
      const db = firebase.firestore();
      const docRef = doc(db, 'research-listings', deleteDocID);
      await deleteDoc(docRef);
      getResearchListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      handleCloseDeleteModal();
    }
  };

  // Admin sees all positions; faculty sees only their own
  const myPositions = isAdmin
    ? researchListings
    : researchListings.filter((item) => item.faculty_members?.includes(uid));

  const displayedPositions = showAll ? myPositions : myPositions.slice(0, 6);

  const handleBackToListings = () => {
    setSelectedResearchId(null);
  };

  return (
    <>
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
          {/* Header row */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h5" fontWeight="bold">
                Research
              </Typography>
              <FormControl
                size="small"
                sx={{
                  minWidth: 160,
                  '& .MuiOutlinedInput-root': { borderRadius: '20px' },
                }}
              >
                <Select
                  value={selectedSemester}
                  onChange={(e) =>
                    setSelectedSemester(e.target.value as string)
                  }
                >
                  <MenuItem value="Spring 2026">Spring 2026</MenuItem>
                  <MenuItem value="Fall 2025">Fall 2025</MenuItem>
                  <MenuItem value="Summer 2025">Summer 2025</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Button
              startIcon={<AddIcon />}
              variant="contained"
              sx={{
                backgroundColor: '#5A41D8',
                color: '#FFFFFF',
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 500,
                padding: '10px 24px',
                '&:hover': {
                  backgroundColor: '#4A35B8',
                },
              }}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Position
            </Button>
          </Box>

          {/* Position cards grid */}
          {myPositions.length === 0 ? (
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
                You haven&apos;t created any research positions yet. Get started
                by creating your first position using the &quot;Create
                Position&quot; button above.
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {displayedPositions.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        border: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.2s',
                        '&:hover': { boxShadow: 4 },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                      onClick={() => setSelectedResearchId(item.docID)}
                    >
                      <FolderOutlinedIcon
                        sx={{ color: '#5A41D8', fontSize: 40 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          fontWeight="bold"
                          noWrap
                          sx={{ fontSize: '0.95rem' }}
                        >
                          {item.project_title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {item.department}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5}>
                        <Button
                          size="small"
                          sx={{
                            minWidth: 'auto',
                            textTransform: 'none',
                            color: '#4CAF50',
                            fontSize: '0.75rem',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingForm(item);
                            setEditModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          sx={{
                            minWidth: 'auto',
                            textTransform: 'none',
                            color: '#F44336',
                            fontSize: '0.75rem',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteModal(item.docID);
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* See More link */}
              {myPositions.length > 6 && !showAll && (
                <Box textAlign="right" mt={2}>
                  <Button
                    sx={{
                      color: '#5A41D8',
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                    onClick={() => setShowAll(true)}
                  >
                    See More
                  </Button>
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Create Position Modal */}
      <ResearchModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        uid={uid}
        onSubmitSuccess={getResearchListings}
        firebaseQuery={postNewResearchPosition}
      />

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

      {/* Edit Modal */}
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
