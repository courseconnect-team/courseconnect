import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
} from '@mui/material';
import ModalApplicationForm from './ModalApplicationForm';
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

interface ProjectCardProps {
  userRole: string;
  uid?: string;
  project_title: string;
  department: string;
  faculty_mentor: {};
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
  onEdit?: () => void;
  onShowApplications?: () => void;
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
  application_requirements,
  application_deadline,
  website,
  applications = [],
  onEdit,
  onShowApplications,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const isFacultyInvolved =
    userRole === 'faculty' && faculty_members.includes(uid || '');
  const [openModal, setOpenModal] = useState(false);

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

  const handleModalOpen = async () => {
    // for (const application of applications) {
    //   if (application?.uid === uid) {
    //     alert('You have already applied to this project.');
    //     return;
    //   }
    // }

    setOpenModal(true);
  };

  return (
    <>
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
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {project_title}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {department}
          </Typography>

          <Box mt={3}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Mentor Information
            </Typography>
            <Typography>
              <strong>Faculty Mentor:</strong>{' '}
              {Object.values(faculty_mentor).join(', ')}
            </Typography>
            <Typography>
              <strong>PhD Student Mentor:</strong>{' '}
              {typeof phd_student_mentor === 'string'
                ? phd_student_mentor
                : Object.entries(phd_student_mentor ?? {})
                    .map(([k, v]) => (k === 'info' ? v : `${v}, ${k}`))
                    .join(' ')}
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Academic Information
            </Typography>
            <Typography>
              <strong>Student Level:</strong> {student_level}
            </Typography>
            <Typography>
              <strong>Terms Available:</strong> {terms_available}
            </Typography>
            <Typography>
              <strong>Prerequisites:</strong> {prerequisites}
            </Typography>
            <Typography>
              <strong>Credit:</strong> {credit}
            </Typography>
            <Typography>
              <strong>Stipend:</strong> {stipend}
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Application Details
            </Typography>
            <Typography>
              <strong>Application Requirements:</strong>{' '}
              {application_requirements}
            </Typography>
            <Typography>
              <strong>Application Deadline:</strong> {application_deadline}
            </Typography>
            <Typography>
              <strong>Website:</strong>{' '}
              {website &&
              !['n/a', 'na', 'none', 'no', ''].includes(
                website.toLowerCase().trim()
              ) ? (
                <a
                  href={
                    website.startsWith('http') ? website : `https://${website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#5A41D8',
                    textDecoration: 'underline',
                    wordBreak: 'break-word',
                  }}
                >
                  {website}
                </a>
              ) : (
                'None provided'
              )}
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Research Description
            </Typography>
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
          {userRole === 'student_applying' || userRole === 'student_applied' ? (
            <Button
              variant="contained"
              sx={{ backgroundColor: '#5A41D8', color: '#FFFFFF' }}
              onClick={() => handleModalOpen()}
            >
              Apply
            </Button>
          ) : isFacultyInvolved ? (
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
          ) : null}
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
