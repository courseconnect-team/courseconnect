import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

interface ProjectCardProps {
  userRole: string;
  uid?: string;
  project_title: string;
  department: string;
  faculty_mentor: string;
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
  onEdit?: () => void;
  onShowApplications?: () => void;
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
  phd_student_mentor,
  prerequisites,
  credit,
  stipend,
  application_requirements,
  application_deadline,
  website,
  onEdit,
  onShowApplications,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isFacultyInvolved =
    userRole === 'faculty' && faculty_members.includes(uid || '');

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '16px',
        boxShadow: 3,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Ensures all cards are equal height
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {' '}
        {/* Allows content to fill space */}
        <Typography variant="h5" fontWeight="bold">
          {project_title}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {department}
        </Typography>
        <Box mt={2}>
          <Typography fontWeight="bold">Faculty Mentor:</Typography>
          <Typography>{faculty_mentor}</Typography>

          <Typography fontWeight="bold">Terms Available:</Typography>
          <Typography>{terms_available}</Typography>

          <Typography fontWeight="bold">Student Level:</Typography>
          <Typography>{student_level}</Typography>
        </Box>
        <Box mt={2} sx={{ flexGrow: 1 }}>
          {' '}
          {/* Expands to fill space */}
          <Typography fontWeight="bold">[Research Description]</Typography>
          <Typography
            sx={{
              display: expanded ? 'block' : '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: expanded ? 'unset' : 3,
              overflow: 'hidden',
            }}
          >
            {project_description}
          </Typography>
        </Box>
      </CardContent>
      <Box display="flex" justifyContent="space-between" p={2}>
        <Button variant="outlined" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Read Less' : 'Read More'}
        </Button>
        {userRole === 'student_applying' ? (
          <Button
            variant="contained"
            sx={{ backgroundColor: '#5A41D8', color: '#FFFFFF' }}
          >
            Apply
          </Button>
        ) : isFacultyInvolved ? (
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              sx={{ backgroundColor: '#4CAF50', color: '#FFFFFF' }}
              onClick={onEdit} // Optional edit handler
            >
              Edit Application
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: '#2196F3', color: '#FFFFFF' }}
              onClick={onShowApplications} // Trigger the callback to show applications
            >
              Show Applications
            </Button>
          </Box>
        ) : null}
      </Box>
    </Card>
  );
};

export default ProjectCard;
