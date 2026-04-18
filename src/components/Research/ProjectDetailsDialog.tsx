import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  Divider,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import { getDepartmentGradient } from './ProjectCard';

interface ProjectDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  onApply?: () => void;
  project_title: string;
  department: string;
  project_description: string;
  faculty_contact?: string;
  phd_student_contact?: string;
  terms_available?: string;
  student_level?: string;
  prerequisites?: string;
  compensation?: string;
  hours_per_week?: string;
  application_deadline?: string;
  image_url?: string;
}

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
}> = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        py: 1.25,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: '10px',
          backgroundColor: '#F4F1FC',
          color: '#5A41D8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: '#8D88A1',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.68rem',
            display: 'block',
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#1F1B2E',
            fontWeight: 500,
            wordBreak: 'break-word',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

const ProjectDetailsDialog: React.FC<ProjectDetailsDialogProps> = ({
  open,
  onClose,
  onApply,
  project_title,
  department,
  project_description,
  faculty_contact,
  phd_student_contact,
  terms_available,
  student_level,
  prerequisites,
  compensation,
  hours_per_week,
  application_deadline,
  image_url,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 160, sm: 220 },
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
                sx={{ fontSize: 72, color: 'rgba(255,255,255,0.4)' }}
              />
            </Box>
          )}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: '#3B2A9B',
              '&:hover': { backgroundColor: '#fff' },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Chip
            label={department}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 20,
              maxWidth: 'calc(100% - 40px)',
              backgroundColor: 'rgba(255,255,255,0.95)',
              color: '#3B2A9B',
              fontWeight: 600,
              fontSize: '0.72rem',
              letterSpacing: 0.2,
              backdropFilter: 'blur(6px)',
            }}
          />
        </Box>

        <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.35rem', sm: '1.6rem' },
              lineHeight: 1.25,
              color: '#1F1B2E',
              mb: 2,
            }}
          >
            {project_title}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: 'wrap', rowGap: 1, mb: 3 }}
          >
            {terms_available && (
              <Chip
                icon={<CalendarTodayOutlinedIcon />}
                label={terms_available}
                size="small"
                sx={{
                  backgroundColor: '#F4F1FC',
                  color: '#4A35B8',
                  fontWeight: 500,
                  '& .MuiChip-icon': { color: '#5A41D8' },
                }}
              />
            )}
            {student_level && (
              <Chip
                icon={<SchoolOutlinedIcon />}
                label={student_level}
                size="small"
                sx={{
                  backgroundColor: '#F4F1FC',
                  color: '#4A35B8',
                  fontWeight: 500,
                  '& .MuiChip-icon': { color: '#5A41D8' },
                }}
              />
            )}
            {hours_per_week && (
              <Chip
                icon={<AccessTimeOutlinedIcon />}
                label={`${hours_per_week} hrs/wk`}
                size="small"
                sx={{
                  backgroundColor: '#F4F1FC',
                  color: '#4A35B8',
                  fontWeight: 500,
                  '& .MuiChip-icon': { color: '#5A41D8' },
                }}
              />
            )}
          </Stack>

          <Typography
            variant="overline"
            sx={{
              color: '#5A41D8',
              fontWeight: 700,
              letterSpacing: 0.8,
              fontSize: '0.72rem',
            }}
          >
            About the project
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#3F3B4D',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.65,
              mt: 0.5,
              mb: 3,
            }}
          >
            {project_description || 'No description provided.'}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              columnGap: 3,
            }}
          >
            <InfoRow
              icon={<PersonOutlineIcon />}
              label="Faculty mentor"
              value={faculty_contact}
            />
            <InfoRow
              icon={<PersonOutlineIcon />}
              label="PhD student mentor"
              value={phd_student_contact}
            />
            <InfoRow
              icon={<MenuBookOutlinedIcon />}
              label="Prerequisites"
              value={prerequisites}
            />
            <InfoRow
              icon={<PaidOutlinedIcon />}
              label="Compensation"
              value={compensation}
            />
            <InfoRow
              icon={<EventOutlinedIcon />}
              label="Application deadline"
              value={application_deadline}
            />
          </Box>

          {onApply && (
            <Box
              sx={{
                mt: 3,
                pt: 3,
                borderTop: '1px solid #EEE9F7',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1.5,
              }}
            >
              <Button
                onClick={onClose}
                sx={{
                  textTransform: 'none',
                  color: '#5A41D8',
                  fontWeight: 600,
                  borderRadius: '999px',
                  px: 2.5,
                }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  onApply();
                  onClose();
                }}
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
                Apply now
              </Button>
            </Box>
          )}
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default ProjectDetailsDialog;
