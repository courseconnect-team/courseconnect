import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ModalApplicationForm from './ModalApplicationForm';

const DEPARTMENT_GRADIENTS: Record<string, string> = {
  'computer and information science and engineering':
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'computer and information sciences and engineering':
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'electrical and computer engineering':
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'engineering education': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'biomedical engineering': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'chemical engineering': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'civil and coastal engineering':
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'environmental engineering sciences':
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'industrial and systems engineering':
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'materials science and engineering':
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'mechanical and aerospace engineering':
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
};

function getDepartmentGradient(department: string): string {
  const key = department?.toLowerCase().trim();
  return (
    DEPARTMENT_GRADIENTS[key] ||
    'linear-gradient(135deg, #5A41D8 0%, #8B5CF6 100%)'
  );
}

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
  image_url,
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
          {/* Listing image / placeholder banner */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: '12px',
              mb: 2,
              overflow: 'hidden',
              ...(image_url
                ? {}
                : { background: getDepartmentGradient(department) }),
            }}
          >
            {image_url ? (
              <Box
                component="img"
                src={image_url}
                alt={project_title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <ScienceOutlinedIcon
                  sx={{ fontSize: 64, color: 'rgba(255,255,255,0.35)' }}
                />
              </Box>
            )}
            {/* Bottom gradient overlay for chip readability */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
            {/* Overlay with department chip */}
            <Chip
              label={department}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                backgroundColor: 'rgba(0,0,0,0.55)',
                color: '#fff',
                fontWeight: 500,
                fontSize: '0.75rem',
                backdropFilter: 'blur(4px)',
              }}
            />
          </Box>

          {/* Always visible: Title */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {project_title}
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
