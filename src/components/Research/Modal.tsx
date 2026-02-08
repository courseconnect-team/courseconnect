import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  INITIAL_FORM_DATA,
  NATURE_OF_JOB_OPTIONS,
  validateResearchForm,
  ResearchFormData,
} from './shared/researchModalUtils';
import ImageUploadField from './shared/ImageUploadField';
import { COLORS } from '@/constants/theme';

interface ResearchModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  firebaseQuery: (formData: any) => Promise<void>;
  uid: string;
}

const ResearchModal: React.FC<ResearchModalProps> = ({
  open,
  onClose,
  onSubmitSuccess,
  firebaseQuery,
  uid,
}) => {
  const [formData, setFormData] = useState<ResearchFormData>({
    ...INITIAL_FORM_DATA,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ResearchFormData, string>>
  >({});
  const [uploading, setUploading] = useState(false);
  const [imageFileName, setImageFileName] = useState('');

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ResearchFormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (url: string, fileName: string) => {
    setFormData((prev) => ({ ...prev, image_url: url }));
    setImageFileName(fileName);
  };

  const validate = (): boolean => {
    const newErrors = validateResearchForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDiscard = () => {
    setFormData({ ...INITIAL_FORM_DATA });
    setErrors({});
    setImageFileName('');
    onClose();
  };

  const handleSaveAndExit = () => {
    // Save draft in state (form data persists until discard)
    onClose();
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const finalFormData = {
      ...formData,
      creator_id: uid,
      faculty_members: [uid],
    };
    await firebaseQuery(finalFormData);
    onSubmitSuccess();
    setFormData({ ...INITIAL_FORM_DATA });
    setErrors({});
    setImageFileName('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: '12px' },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold',
          fontSize: '1.25rem',
        }}
      >
        Create Position
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Row 1: Title + Position Description */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: COLORS.primary }}>*</span> Title
            </Typography>
            <TextField
              name="project_title"
              placeholder="Ex. Research Assistant"
              value={formData.project_title}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.project_title}
              helperText={errors.project_title}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Position Description
            </Typography>
            <TextField
              name="project_description"
              placeholder="Enter description"
              value={formData.project_description}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              rows={4}
              error={!!errors.project_description}
              helperText={errors.project_description}
            />
          </Grid>

          {/* Row 2: Department */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Department
            </Typography>
            <TextField
              name="department"
              placeholder="Ex. ECE"
              value={formData.department}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.department}
              helperText={errors.department}
            />
          </Grid>

          {/* Image Upload */}
          <Grid item xs={12}>
            <ImageUploadField
              imageFileName={imageFileName}
              uploading={uploading}
              onImageUpload={handleImageUpload}
              onUploadStart={() => setUploading(true)}
              onUploadEnd={() => setUploading(false)}
            />
          </Grid>

          {/* Row 3: Nature of Job, Compensation, Faculty Contact, PhD Student Contact */}
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Nature of Job
            </Typography>
            <TextField
              name="nature_of_job"
              select
              value={formData.nature_of_job}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.nature_of_job}
              helperText={errors.nature_of_job}
            >
              {NATURE_OF_JOB_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Compensation
            </Typography>
            <TextField
              name="compensation"
              placeholder="Ex. $10/hr or 2 credits"
              value={formData.compensation}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.compensation}
              helperText={errors.compensation}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Faculty Contact
            </Typography>
            <TextField
              name="faculty_contact"
              placeholder="Ex. albertgator@ufl.edu"
              value={formData.faculty_contact}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.faculty_contact}
              helperText={errors.faculty_contact}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              PhD Student Contact
            </Typography>
            <TextField
              name="phd_student_contact"
              placeholder="Ex. alberta@ufl.edu"
              value={formData.phd_student_contact}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>

          {/* Row 4: Application Deadline, Hours per Week, Prerequisites */}
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Application Deadline
            </Typography>
            <TextField
              name="application_deadline"
              type="date"
              placeholder="Ex. 01/31/2026"
              value={formData.application_deadline}
              onChange={handleChange}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              error={!!errors.application_deadline}
              helperText={errors.application_deadline}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Hours per Week
            </Typography>
            <TextField
              name="hours_per_week"
              placeholder="Ex. 10"
              value={formData.hours_per_week}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.hours_per_week}
              helperText={errors.hours_per_week}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Prerequisites
            </Typography>
            <TextField
              name="prerequisites"
              placeholder="Enter description"
              value={formData.prerequisites}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Grid>

          {/* Row 5: Terms Available, Student Level, Website, Application Requirements */}
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Terms Available
            </Typography>
            <TextField
              name="terms_available"
              placeholder="Ex. Fall, Spring"
              value={formData.terms_available}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Student Level
            </Typography>
            <TextField
              name="student_level"
              placeholder="Ex. Junior, Senior"
              value={formData.student_level}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Website
            </Typography>
            <TextField
              name="website"
              placeholder="Ex. https://lab.ufl.edu"
              value={formData.website}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Application Requirements
            </Typography>
            <TextField
              name="application_requirements"
              placeholder="Ex. Resume, Transcript"
              value={formData.application_requirements}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={handleDiscard}
          sx={{
            textTransform: 'none',
            color: COLORS.primary,
            fontWeight: 500,
          }}
        >
          Discard
        </Button>
        <Box display="flex" gap={1}>
          <Button
            onClick={handleSaveAndExit}
            sx={{
              textTransform: 'none',
              color: COLORS.primary,
              fontWeight: 500,
            }}
          >
            Save & Exit
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              backgroundColor: COLORS.primary,
              color: COLORS.white,
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: COLORS.primaryDark,
              },
            }}
          >
            Create & Post
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ResearchModal;
