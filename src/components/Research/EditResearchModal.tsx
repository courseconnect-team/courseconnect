'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  MenuItem,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-hot-toast';
import { normalizeResearchListing } from '@/app/models/ResearchModel';
import { updateResearchListing } from '@/services/researchService';
import {
  NATURE_OF_JOB_OPTIONS,
  ResearchFormData,
} from './shared/researchModalUtils';
import ImageUploadField from './shared/ImageUploadField';
import { COLORS } from '@/constants/theme';

interface EditResearchModalProps {
  open: boolean;
  onClose: () => void;
  listingData: any;
  onSubmitSuccess: () => void;
}

const EditResearchModal: React.FC<EditResearchModalProps> = ({
  open,
  onClose,
  listingData,
  onSubmitSuccess,
}) => {
  const [formData, setFormData] = useState<ResearchFormData>(
    {} as ResearchFormData
  );
  const [uploading, setUploading] = useState(false);
  const [imageFileName, setImageFileName] = useState('');

  useEffect(() => {
    const normalized = normalizeResearchListing(listingData);
    setFormData(normalized as any);
    if (normalized.image_url) {
      setImageFileName('Current image');
    }
  }, [listingData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (url: string, fileName: string) => {
    setFormData((prev) => ({ ...prev, image_url: url }));
    setImageFileName(fileName);
  };

  const handleSubmit = async () => {
    try {
      const docID = listingData.docID || listingData.id;
      await updateResearchListing(docID, formData);
      toast.success('Research listing updated!');
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update listing.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: '12px' } }}
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
        Edit Position
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Title + Description */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: COLORS.primary }}>*</span> Title
            </Typography>
            <TextField
              name="project_title"
              placeholder="Ex. Research Assistant"
              value={formData.project_title || ''}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: COLORS.primary }}>*</span> Position
              Description
            </Typography>
            <TextField
              name="project_description"
              placeholder="Enter description"
              value={formData.project_description || ''}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              rows={4}
            />
          </Grid>

          {/* Department */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: COLORS.primary }}>*</span> Department
            </Typography>
            <TextField
              name="department"
              placeholder="Ex. ECE"
              value={formData.department || ''}
              onChange={handleChange}
              fullWidth
              size="small"
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

          {/* Nature of Job, Compensation, Faculty Contact, PhD Student Contact */}
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: COLORS.primary }}>*</span> Nature of Job
            </Typography>
            <TextField
              name="nature_of_job"
              select
              value={formData.nature_of_job || ''}
              onChange={handleChange}
              fullWidth
              size="small"
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
              <span style={{ color: COLORS.primary }}>*</span> Compensation
            </Typography>
            <TextField
              name="compensation"
              placeholder="Ex. $10/hr or 2 credits"
              value={formData.compensation || ''}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: COLORS.primary }}>*</span> Faculty Contact
            </Typography>
            <TextField
              name="faculty_contact"
              placeholder="Ex. albertgator@ufl.edu"
              value={formData.faculty_contact || ''}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              PhD Student Contact
            </Typography>
            <TextField
              name="phd_student_contact"
              placeholder="Ex. alberta@ufl.edu"
              value={formData.phd_student_contact || ''}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>

          {/* Application Deadline, Hours per Week, Prerequisites */}
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: COLORS.primary }}>*</span> Application
              Deadline
            </Typography>
            <TextField
              name="application_deadline"
              type="date"
              value={formData.application_deadline || ''}
              onChange={handleChange}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: COLORS.primary }}>*</span> Hours per Week
            </Typography>
            <TextField
              name="hours_per_week"
              placeholder="Ex. 10"
              value={formData.hours_per_week || ''}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Prerequisites
            </Typography>
            <TextField
              name="prerequisites"
              placeholder="Enter description"
              value={formData.prerequisites || ''}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Grid>

          {/* Terms Available, Student Level, Website, Application Requirements */}
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Terms Available
            </Typography>
            <TextField
              name="terms_available"
              placeholder="Ex. Fall, Spring"
              value={formData.terms_available || ''}
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
              value={formData.student_level || ''}
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
              value={formData.website || ''}
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
              value={formData.application_requirements || ''}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: 'none', color: COLORS.primary, fontWeight: 500 }}
        >
          Cancel
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
            '&:hover': { backgroundColor: COLORS.primaryDark },
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditResearchModal;
