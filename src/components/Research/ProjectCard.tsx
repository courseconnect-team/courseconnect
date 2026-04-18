import React, { useState } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ModalApplicationForm from './ModalApplicationForm';
import ProjectDetailsDialog from './ProjectDetailsDialog';

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

export function getDepartmentGradient(department: string): string {
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
  faculty_contact?: string;
  phd_student_contact?: string;
  compensation?: string;
  nature_of_job?: string;
  hours_per_week?: string;
  image_url?: string;
  onEdit?: () => void;
  onShowApplications?: () => void;
  onDelete?: () => void;
  listingId: string;
}

const MetaChip: React.FC<{
  icon: React.ReactNode;
  label: string;
}> = ({ icon, label }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      px: 1.25,
      py: 0.5,
      borderRadius: '999px',
      backgroundColor: '#F4F1FC',
      color: '#4A35B8',
      fontSize: '0.75rem',
      fontWeight: 500,
      maxWidth: '100%',
      '& svg': { fontSize: 14 },
    }}
  >
    {icon}
    <Box
      component="span"
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Box>
  </Box>
);

const ProjectCard: React.FC<ProjectCardProps> = (props) => {
  const {
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
    faculty_contact,
    phd_student_contact,
    compensation,
    hours_per_week,
    image_url,
    onEdit,
    onShowApplications,
    onDelete,
  } = props;

  const isFacultyInvolved =
    userRole === 'faculty' && faculty_members.includes(uid || '');
  const [openApply, setOpenApply] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);

  const facultyDisplay =
    faculty_contact ||
    (typeof faculty_mentor === 'object' && faculty_mentor
      ? Object.values(faculty_mentor).join(', ')
      : typeof faculty_mentor === 'string'
      ? faculty_mentor
      : '');

  const compensationDisplay =
    compensation || [credit, stipend].filter(Boolean).join(', ') || '';

  const isStudent =
    userRole === 'student_applying' || userRole === 'student_applied';

  return (
    <>
      <Card
        sx={{
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)',
          border: '1px solid #EEE9F7',
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          transition:
            'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 12px 32px rgba(90, 65, 216, 0.14)',
            borderColor: '#D7CCF4',
          },
        }}
      >
        <CardActionArea
          onClick={() => setOpenDetails(true)}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            '&:hover .MuiCardActionArea-focusHighlight': { opacity: 0 },
          }}
        >
          {/* Banner */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
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
                  sx={{ fontSize: 56, color: 'rgba(255,255,255,0.4)' }}
                />
              </Box>
            )}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)',
                pointerEvents: 'none',
              }}
            />
            <Chip
              label={department}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                maxWidth: 'calc(100% - 24px)',
                backgroundColor: 'rgba(255,255,255,0.92)',
                color: '#3B2A9B',
                fontWeight: 600,
                fontSize: '0.7rem',
                letterSpacing: 0.2,
                backdropFilter: 'blur(6px)',
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            />
          </Box>

          <CardContent
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              p: 2.5,
              pb: 1.5,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1.05rem',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                overflow: 'hidden',
                minHeight: '2.6em',
                mb: 0.75,
              }}
            >
              {project_title}
            </Typography>

            {facultyDisplay && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  color: '#6B5AA8',
                  mb: 1.25,
                }}
              >
                <PersonOutlineIcon sx={{ fontSize: 16 }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {facultyDisplay}
                </Typography>
              </Box>
            )}

            <Typography
              variant="body2"
              sx={{
                color: '#4B4B55',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3,
                overflow: 'hidden',
                lineHeight: 1.5,
                minHeight: '4.5em',
                mb: 1.5,
              }}
            >
              {project_description}
            </Typography>

            <Stack
              direction="row"
              spacing={0.75}
              sx={{ flexWrap: 'wrap', rowGap: 0.75, mt: 'auto' }}
            >
              {terms_available && (
                <MetaChip
                  icon={<CalendarTodayOutlinedIcon />}
                  label={terms_available}
                />
              )}
              {student_level && (
                <MetaChip icon={<SchoolOutlinedIcon />} label={student_level} />
              )}
              {hours_per_week && (
                <MetaChip
                  icon={<AccessTimeOutlinedIcon />}
                  label={`${hours_per_week} hrs/wk`}
                />
              )}
              {compensationDisplay && (
                <MetaChip
                  icon={<PaidOutlinedIcon />}
                  label={compensationDisplay}
                />
              )}
            </Stack>
          </CardContent>
        </CardActionArea>

        {/* Footer actions */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: '1px solid #F1ECFA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            backgroundColor: '#FBFAFE',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: application_deadline ? '#6B5AA8' : '#9A96A8',
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          >
            {application_deadline
              ? `Apply by ${application_deadline}`
              : 'Rolling applications'}
          </Typography>

          {isStudent && (
            <Button
              variant="contained"
              size="small"
              onClick={() => setOpenApply(true)}
              sx={{
                backgroundColor: '#5A41D8',
                color: '#fff',
                textTransform: 'none',
                borderRadius: '999px',
                fontWeight: 600,
                px: 2.25,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#4A35B8',
                  boxShadow: '0 6px 18px rgba(90, 65, 216, 0.28)',
                },
              }}
            >
              Apply
            </Button>
          )}

          {isFacultyInvolved && (
            <Box display="flex" gap={0.5}>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                sx={{
                  textTransform: 'none',
                  color: '#4CAF50',
                  fontSize: '0.78rem',
                  minWidth: 'auto',
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowApplications?.();
                }}
                sx={{
                  textTransform: 'none',
                  color: '#2196F3',
                  fontSize: '0.78rem',
                  minWidth: 'auto',
                }}
              >
                Applications
              </Button>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                sx={{
                  textTransform: 'none',
                  color: '#F44336',
                  fontSize: '0.78rem',
                  minWidth: 'auto',
                }}
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>
      </Card>

      <ProjectDetailsDialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        onApply={isStudent ? () => setOpenApply(true) : undefined}
        project_title={project_title}
        department={department}
        project_description={project_description}
        faculty_contact={facultyDisplay}
        phd_student_contact={
          phd_student_contact ||
          (typeof phd_student_mentor === 'string'
            ? phd_student_mentor
            : typeof phd_student_mentor === 'object' && phd_student_mentor
            ? Object.values(phd_student_mentor as Record<string, string>).join(
                ', '
              )
            : '')
        }
        terms_available={terms_available}
        student_level={student_level}
        prerequisites={prerequisites}
        compensation={compensationDisplay}
        hours_per_week={hours_per_week}
        application_deadline={application_deadline}
        image_url={image_url}
      />

      <ModalApplicationForm
        open={openApply}
        onClose={() => setOpenApply(false)}
        listingId={listingId}
      />
    </>
  );
};

export default ProjectCard;
