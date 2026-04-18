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
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ResearchModal from '@/components/Research/Modal';
import FacultyApplicantsView from '@/components/Research/FacultyApplicantsView';
import { deleteResearchListing } from '@/services/researchService';
import EditResearchModal from './EditResearchModal';
import { getDepartmentGradient } from './ProjectCard';

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
      await deleteResearchListing(deleteDocID);
      getResearchListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      handleCloseDeleteModal();
    }
  };

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
            flexWrap="wrap"
            gap={2}
            mb={3}
          >
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: '#1F1B2E' }}
                >
                  My Positions
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B6B78' }}>
                  {myPositions.length}{' '}
                  {myPositions.length === 1 ? 'position' : 'positions'} posted
                </Typography>
              </Box>
              <FormControl
                size="small"
                sx={{
                  minWidth: 160,
                  '& .MuiOutlinedInput-root': { borderRadius: '999px' },
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
                borderRadius: '999px',
                fontWeight: 600,
                padding: '10px 22px',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#4A35B8',
                  boxShadow: '0 6px 18px rgba(90, 65, 216, 0.28)',
                },
              }}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Position
            </Button>
          </Box>

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
                border: '1px dashed #D7CCF4',
                borderRadius: '16px',
                backgroundColor: '#FBFAFE',
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: '#F4F1FC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <ScienceOutlinedIcon sx={{ color: '#5A41D8', fontSize: 36 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: '#1F1B2E', mb: 0.5 }}
              >
                No research positions yet
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#6B6B78', maxWidth: 520, mb: 3 }}
              >
                Get started by creating your first position. Students will be
                able to discover and apply right away.
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => setCreateModalOpen(true)}
                sx={{
                  backgroundColor: '#5A41D8',
                  color: '#fff',
                  textTransform: 'none',
                  borderRadius: '999px',
                  fontWeight: 600,
                  px: 3,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#4A35B8',
                    boxShadow: '0 6px 18px rgba(90, 65, 216, 0.28)',
                  },
                }}
              >
                Create your first position
              </Button>
            </Box>
          ) : (
            <>
              <Grid container spacing={2.5}>
                {displayedPositions.map((item, index) => {
                  const applicationCount = Array.isArray(item.applications)
                    ? item.applications.length
                    : 0;
                  return (
                    <Grid item xs={12} sm={6} lg={4} key={index}>
                      <Card
                        sx={{
                          position: 'relative',
                          p: 2.25,
                          pl: 3,
                          borderRadius: '14px',
                          border: '1px solid #EEE9F7',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          overflow: 'hidden',
                          transition:
                            'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                          boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 10px 24px rgba(90, 65, 216, 0.12)',
                            borderColor: '#D7CCF4',
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: 6,
                            background: getDepartmentGradient(item.department),
                          },
                        }}
                        onClick={() => setSelectedResearchId(item.docID)}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: '#1F1B2E',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 1,
                              overflow: 'hidden',
                            }}
                          >
                            {item.project_title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#6B6B78',
                              fontSize: '0.8rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.department}
                          </Typography>
                          <Box
                            sx={{
                              mt: 0.75,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1,
                              py: 0.25,
                              borderRadius: '999px',
                              backgroundColor: '#F4F1FC',
                              color: '#4A35B8',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                          >
                            <GroupsOutlinedIcon sx={{ fontSize: 14 }} />
                            {applicationCount}{' '}
                            {applicationCount === 1
                              ? 'applicant'
                              : 'applicants'}
                          </Box>
                        </Box>
                        <Box display="flex" gap={0.25}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingForm(item);
                                setEditModalOpen(true);
                              }}
                              sx={{
                                color: '#5A41D8',
                                '&:hover': {
                                  backgroundColor: 'rgba(90, 65, 216, 0.08)',
                                },
                              }}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteModal(item.docID);
                              }}
                              sx={{
                                color: '#E15A6A',
                                '&:hover': {
                                  backgroundColor: 'rgba(225, 90, 106, 0.08)',
                                },
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {myPositions.length > 6 && !showAll && (
                <Box textAlign="right" mt={2}>
                  <Button
                    sx={{
                      color: '#5A41D8',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '999px',
                    }}
                    onClick={() => setShowAll(true)}
                  >
                    See all {myPositions.length}
                  </Button>
                </Box>
              )}
            </>
          )}
        </>
      )}

      <ResearchModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        uid={uid}
        onSubmitSuccess={getResearchListings}
        firebaseQuery={postNewResearchPosition}
      />

      <Dialog
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        aria-labelledby="delete-confirmation-title"
        aria-describedby="delete-confirmation-description"
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle id="delete-confirmation-title" sx={{ fontWeight: 700 }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-confirmation-description">
            Are you sure you want to delete this research listing? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDeleteModal}
            sx={{
              color: '#5A41D8',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '999px',
              '&:hover': { backgroundColor: 'rgba(90, 65, 216, 0.04)' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{
              backgroundColor: '#E15A6A',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '999px',
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#C94757' },
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
