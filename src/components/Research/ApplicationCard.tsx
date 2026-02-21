import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

interface ApplicationCardProps {
  userRole: string;
  uid?: string;
  project_title: string;
  department: string;
  faculty_mentor?: { [email: string]: string } | string;
  date_applied: string;
  terms_available: string;
  student_level: string;
  project_description: string;
  faculty_members?: string[];
  phd_student_mentor?: string;
  prerequisites?: string;
  credit?: string;
  stipend?: string;
  application_requirements?: string;
  application_deadline?: string;
  website?: string;
  app_status: string;
  faculty_contact?: string;
  compensation?: string;
  onEdit?: () => void;
  onShowApplications?: () => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  userRole,
  uid,
  project_title,
  department,
  date_applied,
  faculty_mentor,
  faculty_members = [],
  app_status,
  project_description,
  faculty_contact,
  onEdit,
  onShowApplications,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isFacultyInvolved =
    userRole === 'faculty' && faculty_members.includes(uid || '');

  // Backward-compatible faculty display
  const facultyDisplay =
    faculty_contact ||
    (typeof faculty_mentor === 'object' && faculty_mentor
      ? Object.values(faculty_mentor).join(', ')
      : typeof faculty_mentor === 'string'
      ? faculty_mentor
      : 'N/A');

  const sectionHeaderSx = {
    color: '#5A41D8',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    mt: 2,
    mb: 0.5,
  };

  return (
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
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {project_title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {department}
        </Typography>

        <Box mt={1}>
          <Typography variant="body2">
            <strong>Status:</strong>{' '}
            <Typography
              component="span"
              variant="body2"
              sx={{
                color:
                  app_status === 'Pending'
                    ? 'warning.main'
                    : app_status === 'Denied'
                    ? 'error.main'
                    : 'success.main',
                fontWeight: 600,
              }}
            >
              {app_status}
            </Typography>
          </Typography>
          <Typography variant="body2">
            <strong>Date Applied:</strong> {date_applied}
          </Typography>
          <Typography variant="body2">
            <strong>Faculty Mentor:</strong> {facultyDisplay}
          </Typography>
        </Box>

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
      </CardContent>

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

        {isFacultyInvolved && (
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              size="small"
              sx={{
                backgroundColor: '#4CAF50',
                color: '#FFFFFF',
                textTransform: 'none',
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
              }}
              onClick={onShowApplications}
            >
              Applications
            </Button>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default ApplicationCard;
