'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import firebase from '@/firebase/firebase_config';
import { normalizeResearchListing } from '@/app/models/ResearchModel';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const NATURE_OF_JOB_OPTIONS = [
  'Research Assistant',
  'Lab Assistant',
  'Teaching Assistant',
  'Field Work',
  'Data Analysis',
  'Other',
];

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
  const [formData, setFormData] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [imageFileName, setImageFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const normalized = normalizeResearchListing(listingData);
    setFormData(normalized);
    if (normalized.image_url) {
      setImageFileName('Current image');
    }
  }, [listingData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `research-images/${uuidv4()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setFormData((prev: any) => ({ ...prev, image_url: downloadURL }));
      setImageFileName(file.name);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSubmit = async () => {
    try {
      const db = firebase.firestore();
      const docID = listingData.docID || listingData.id;
      const listingRef = db.collection('research-listings').doc(docID);
      const doc = await listingRef.get();

      if (!doc.exists) {
        throw new Error('No matching listing found!');
      }

      const updateData = {
        project_title: formData.project_title || '',
        project_description: formData.project_description || '',
        department: formData.department || '',
        nature_of_job: formData.nature_of_job || '',
        compensation: formData.compensation || '',
        faculty_contact: formData.faculty_contact || '',
        phd_student_contact: formData.phd_student_contact || '',
        application_deadline: formData.application_deadline || '',
        hours_per_week: formData.hours_per_week || '',
        prerequisites: formData.prerequisites || '',
        image_url: formData.image_url || '',
        terms_available: formData.terms_available || '',
        student_level: formData.student_level || '',
        application_requirements: formData.application_requirements || '',
        website: formData.website || '',
      };

      await listingRef.update(updateData);
      alert('Research listing updated!');
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update listing.');
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
              <span style={{ color: '#5A41D8' }}>*</span> Title
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
              <span style={{ color: '#5A41D8' }}>*</span> Position Description
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
              <span style={{ color: '#5A41D8' }}>*</span> Department
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
            <Box
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed #ccc',
                borderRadius: '12px',
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#fafafa',
                '&:hover': { borderColor: '#5A41D8' },
              }}
            >
              {uploading ? (
                <CircularProgress size={24} />
              ) : imageFileName ? (
                <Typography variant="body2" color="text.secondary">
                  {imageFileName}
                </Typography>
              ) : (
                <>
                  <ImageOutlinedIcon
                    sx={{ fontSize: 40, color: '#999', mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Drop your image here, or{' '}
                    <span style={{ color: '#5A41D8', fontWeight: 'bold' }}>
                      browse
                    </span>
                  </Typography>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileSelect}
              />
            </Box>
          </Grid>

          {/* Nature of Job, Compensation, Faculty Contact, PhD Student Contact */}
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Nature of Job
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
              <span style={{ color: '#5A41D8' }}>*</span> Compensation
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
              <span style={{ color: '#5A41D8' }}>*</span> Faculty Contact
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
              <span style={{ color: '#5A41D8' }}>*</span> Application Deadline
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
              <span style={{ color: '#5A41D8' }}>*</span> Hours per Week
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
          sx={{ textTransform: 'none', color: '#5A41D8', fontWeight: 500 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            backgroundColor: '#5A41D8',
            color: '#FFFFFF',
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: '8px',
            '&:hover': { backgroundColor: '#4A35B8' },
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditResearchModal;
