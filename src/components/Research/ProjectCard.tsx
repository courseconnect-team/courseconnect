import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import ModalApplicationForm from './ModalApplicationForm';

interface ProjectCardProps {
  userRole: string;
  uid?: string;
  project_title: string;
  department: string;
  faculty_mentor?: { [email: string]: string } | string;
  terms_available: string;
  student_level: string;
  project_description: string;
  faculty_members?: string[];
  phd_student_mentor?: {} | string;
  prerequisites?: string;
  credit?: string;
  stipend?: string;
  application_requirements?: string;
  application_deadline?: string;
  website?: string;
  applications?: any[];
  // New fields
  faculty_contact?: string;
  phd_student_contact?: string;
  compensation?: string;
  nature_of_job?: string;
  hours_per_week?: string;
  image_url?: string;
  // Callbacks
  onEdit?: () => void;
  onShowApplications?: () => void;
  onDelete?: () => void;
  listingId: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  userRole,
  uid,
  project_title,
  department,
  faculty_mentor,
  terms_available,
  student_level,
  project_description,
  faculty_members = [],
  listingId,
  phd_student_mentor,
  prerequisites,
  credit,
  stipend,
  application_deadline,
  applications = [],
  faculty_contact,
  phd_student_contact,
  compensation,
  onEdit,
  onShowApplications,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isFacultyInvolved =
    userRole === 'faculty' && faculty_members.includes(uid || '');
  const [openModal, setOpenModal] = useState(false);

  // Backward-compatible display helpers
  const facultyDisplay =
    faculty_contact ||
    (typeof faculty_mentor === 'object' && faculty_mentor
      ? Object.values(faculty_mentor).join(', ')
      : typeof faculty_mentor === 'string'
      ? faculty_mentor
      : 'N/A');

  const phdDisplay =
    phd_student_contact ||
    (typeof phd_student_mentor === 'string'
      ? phd_student_mentor
      : typeof phd_student_mentor === 'object' && phd_student_mentor
      ? Object.values(phd_student_mentor as Record<string, string>).join(', ')
      : 'N/A');

  const compensationDisplay =
    compensation || [credit, stipend].filter(Boolean).join(', ') || 'N/A';

  const handleModalOpen = async () => {
    setOpenModal(true);
  };

  const sectionHeaderSx = {
    color: '#5A41D8',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    mt: 2,
    mb: 0.5,
  };

  return (
    <>
      <Card
        sx={{
          p: 2,
          borderRadius: '16px',
          boxShadow: 3,
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Always visible: Title + Department */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {project_title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {department}
          </Typography>

          {/* Research Description (always visible) */}
          <Typography sx={sectionHeaderSx}>Research Description</Typography>
          <Typography
            variant="body2"
            sx={{
              display: expanded ? 'block' : '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: expanded ? 'unset' : 3,
              overflow: 'hidden',
            }}
          >
            {project_description}
          </Typography>

          {/* Application Details (always visible) */}
          <Typography sx={sectionHeaderSx}>Application Details</Typography>
          <Typography variant="body2">
            <strong>Application Deadline:</strong>{' '}
            {application_deadline || 'N/A'}
          </Typography>

          {/* Expanded content */}
          {expanded && (
            <>
              {/* Mentor Information */}
              <Typography sx={sectionHeaderSx}>Mentor Information</Typography>
              <Typography variant="body2">
                <strong>Faculty Mentor:</strong> {facultyDisplay}
              </Typography>
              <Typography variant="body2">
                <strong>PhD Student Mentor:</strong> {phdDisplay}
              </Typography>

              {/* Academic Information */}
              <Typography sx={sectionHeaderSx}>Academic Information</Typography>
              <Typography variant="body2">
                <strong>Student Level:</strong> {student_level || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Terms Available:</strong> {terms_available || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Prerequisites:</strong> {prerequisites || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Compensation:</strong> {compensationDisplay}
              </Typography>
            </>
          )}
        </CardContent>

        {/* Action buttons */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={2}
          pb={1}
        >
          <Button
            variant="text"
            onClick={() => setExpanded(!expanded)}
            sx={{
              textTransform: 'none',
              color: '#5A41D8',
              fontWeight: 500,
              fontSize: '0.85rem',
            }}
          >
            {expanded ? 'View Less' : 'View More'}
          </Button>

          {(userRole === 'student_applying' ||
            userRole === 'student_applied') && (
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#5A41D8',
                color: '#FFFFFF',
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 500,
                '&:hover': { backgroundColor: '#4A35B8' },
              }}
              onClick={() => handleModalOpen()}
            >
              Apply
            </Button>
          )}

          {isFacultyInvolved && (
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: '#4CAF50',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                }}
                onClick={onEdit}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: '#2196F3',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                }}
                onClick={onShowApplications}
              >
                Applications
              </Button>
              <Button
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: '#F44336',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                }}
                onClick={onDelete}
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>
      </Card>
      <ModalApplicationForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        listingId={listingId}
      />
    </>
  );
};

export default ProjectCard;
