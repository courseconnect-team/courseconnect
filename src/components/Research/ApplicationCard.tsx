import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

interface ApplicationCardProps {
  userRole: string;
  uid?: string;
  project_title: string;
  department: string;
  faculty_mentor: { name: string; email: string };
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
  terms_available,
  student_level,
  project_description,
  faculty_members = [],
  app_status,
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
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const isFacultyInvolved =
    userRole === 'faculty' && faculty_members.includes(uid || '');

  useEffect(() => {
    const checkTextOverflow = () => {
      const element = descriptionRef.current;
      if (!element) return;

      if (expanded) {
        setNeedsExpansion(true);
        return;
      }

      const isOverflowing = element.scrollHeight > element.clientHeight;
      setNeedsExpansion(isOverflowing);
    };

    checkTextOverflow();

    window.addEventListener('resize', checkTextOverflow);
    return () => window.removeEventListener('resize', checkTextOverflow);
  }, [expanded, project_description]);

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '16px',
        boxShadow: 3,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h5" fontWeight="bold">
          {project_title}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {department}
        </Typography>
        <Box mt={2}>
          <Typography fontWeight="bold" display="inline">
            Status:
          </Typography>{' '}
          <Typography
            variant="subtitle1"
            color={
              app_status === 'Pending'
                ? 'warning.main'
                : app_status === 'Denied'
                ? 'error.main'
                : 'success.main'
            }
            display="inline"
          >
            {app_status}
          </Typography>
          <br />
          <Typography fontWeight="bold" display="inline">
            Date Applied:
          </Typography>{' '}
          <Typography
            variant="subtitle1"
            color="text.secondary"
            display="inline"
          >
            {date_applied}
          </Typography>
        </Box>
        <Box mt={2}>
          <Typography fontWeight="bold" display="inline">
            Faculty Mentor:
          </Typography>{' '}
          <Typography
            variant="subtitle1"
            color="text.secondary"
            display="inline"
          >
            {Object.entries(faculty_mentor ?? {})
              .map(([key, value]) => `${value}`)
              .join(', ')}
          </Typography>
          <br />
          <Typography fontWeight="bold" display="inline">
            Faculty Email:
          </Typography>{' '}
          <Typography
            variant="subtitle1"
            color="text.secondary"
            display="inline"
          >
            {Object.entries(faculty_mentor ?? {})
              .map(([key, value]) => `${key}`)
              .join(', ')}
          </Typography>
        </Box>
        <Box mt={2} sx={{ flexGrow: 1 }}>
          <Typography fontWeight="bold">Research Description</Typography>
          <Typography
            ref={descriptionRef}
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
        {needsExpansion ? (
          <Button variant="outlined" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Read Less' : 'Read More'}
          </Button>
        ) : (
          <div></div>
        )}
        {isFacultyInvolved && (
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              sx={{ backgroundColor: '#4CAF50', color: '#FFFFFF' }}
              onClick={onEdit}
            >
              Edit Application
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: '#2196F3', color: '#FFFFFF' }}
              onClick={onShowApplications}
            >
              Show Applications
            </Button>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default ApplicationCard;
