import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Divider,
  SxProps,
  Paper,
  Grid,
} from '@mui/material';
import { Theme } from '@emotion/react';

interface FormData {
  item: any;
  buttonText?: string;
  buttonStyle?: SxProps<Theme>;
}

// Fields that should be hidden from the review
const HIDDEN_FIELDS = ['id', 'uid', 'docID', 'appid', '_id', 'app_id', 'key'];

// Fields that should be displayed first and in a specific order
const PRIORITY_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'department',
  'degree',
  'gpa',
  'graduationDate',
  'project_title',
  'qualifications',
  'weeklyHours',
  'resume',
  'app_status',
  'date_applied',
];

// Fields that should be displayed with more space (multiline)
const MULTILINE_FIELDS = [
  'qualifications',
  'project_description',
  'message',
  'additional_info',
];

// Human-readable field labels
const FIELD_LABELS: Record<string, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  qualifications: 'Qualifications',
  project_title: 'Project Title',
  terms_available: 'Terms Available',
  student_level: 'Student Level',
  degree: 'Degree',
  gpa: 'GPA',
  date_applied: 'Date Applied',
  app_status: 'Application Status',
};

/** ReviewModal component for viewing application details */
const ReviewModal: React.FC<FormData> = ({
  item,
  buttonText = 'Review',
  buttonStyle,
}) => {
  const [open, setOpen] = useState(false);

  /** Opens the dialog (modal). */
  const handleOpen = () => {
    setOpen(true);
  };

  /** Closes the dialog (modal). */
  const handleClose = () => {
    setOpen(false);
  };

  // Get formatted field label
  const getFieldLabel = (key: string): string => {
    // Return predefined label if available
    if (FIELD_LABELS[key]) return FIELD_LABELS[key];

    // Format camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      ); // Capitalize first letter
  };

  // Check if field should be displayed
  const shouldDisplayField = (key: string, value: any): boolean => {
    if (HIDDEN_FIELDS.includes(key.toLowerCase())) return false;
    if (
      key.toLowerCase().includes('id') &&
      typeof value === 'string' &&
      value.length > 20
    )
      return false;
    if (value === undefined || value === null) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0)
      return false;
    return true;
  };

  // Format field value for display
  const formatFieldValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Order fields for display
  const getOrderedFields = () => {
    const entries = Object.entries(item).filter(([key, value]) =>
      shouldDisplayField(key, value)
    );

    // Extract priority fields first (in specified order)
    const priorityEntries = PRIORITY_FIELDS.map((key) =>
      entries.find(([entryKey]) => entryKey.toLowerCase() === key.toLowerCase())
    ).filter((entry) => entry !== undefined) as [string, any][];

    // Get remaining fields
    const remainingEntries = entries.filter(
      ([key]) =>
        !PRIORITY_FIELDS.some(
          (priorityKey) => priorityKey.toLowerCase() === key.toLowerCase()
        )
    );

    return [...priorityEntries, ...remainingEntries];
  };

  return (
    <div>
      {/* Button to open the modal */}
      <Button
        onClick={handleOpen}
        variant="outlined"
        sx={
          buttonStyle
            ? buttonStyle
            : {
                borderColor: '#5A41D8',
                color: '#5A41D8',
                '&:hover': {
                  borderColor: '#4A35B8',
                  backgroundColor: 'rgba(90, 65, 216, 0.04)',
                },
              }
        }
      >
        {buttonText}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', py: 2 }}>
          Review Application
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            {item.project_title && (
              <Typography variant="h6" gutterBottom>
                {item.project_title}
              </Typography>
            )}

            {item.date_applied && (
              <Typography variant="subtitle2" color="text.secondary">
                Applied: {item.date_applied}
              </Typography>
            )}
          </Box>

          {/* Personal Info */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Personal Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {['first_name', 'last_name', 'email', 'phone'].map((key) =>
              item[key] ? (
                <Grid item xs={6} key={key}>
                  <Typography variant="subtitle2">
                    {getFieldLabel(key)}
                  </Typography>
                  <Typography>{formatFieldValue(key, item[key])}</Typography>
                </Grid>
              ) : null
            )}
          </Grid>

          {/* Academic Info */}
          <Typography
            variant="subtitle1"
            sx={{ mt: 4, mb: 1, fontWeight: 600 }}
          >
            Academic Background
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {['department', 'degree', 'gpa', 'student_level'].map((key) =>
              item[key] ? (
                <Grid item xs={6} key={key}>
                  <Typography variant="subtitle2">
                    {getFieldLabel(key)}
                  </Typography>
                  <Typography>{formatFieldValue(key, item[key])}</Typography>
                </Grid>
              ) : null
            )}
          </Grid>

          {/* Application Info */}
          <Typography
            variant="subtitle1"
            sx={{ mt: 4, mb: 1, fontWeight: 600 }}
          >
            Application Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {['weeklyHours', 'resume', 'app_status'].map((key) =>
              item[key] ? (
                <Grid item xs={6} key={key}>
                  <Typography variant="subtitle2">
                    {getFieldLabel(key)}
                  </Typography>
                  <Typography>{formatFieldValue(key, item[key])}</Typography>
                </Grid>
              ) : null
            )}

            {item.qualifications && (
              <Grid item xs={12}>
                <Typography variant="subtitle2">
                  {getFieldLabel('qualifications')}
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, backgroundColor: '#fafafa' }}
                >
                  <Typography whiteSpace="pre-wrap" sx={{ lineHeight: 1.6 }}>
                    {formatFieldValue('qualifications', item.qualifications)}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              backgroundColor: '#5A41D8',
              '&:hover': {
                backgroundColor: '#4A35B8',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ReviewModal;
