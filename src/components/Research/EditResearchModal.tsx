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
  Checkbox,
  FormControlLabel,
  Typography,
} from '@mui/material';
import firebase from '@/firebase/firebase_config';

interface EditResearchModalProps {
  open: boolean;
  onClose: () => void;
  listingData: any; // The current listing's data (pre-filled)
  onSubmitSuccess: () => void; // Callback to refresh the listings
}

const EditResearchModal: React.FC<EditResearchModalProps> = ({
  open,
  onClose,
  listingData,
  onSubmitSuccess,
}) => {
  const [formData, setFormData] = useState({ ...listingData });

  useEffect(() => {
    setFormData({ ...listingData });
  }, [listingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev: typeof formData) => ({
      ...prev,
      [name]: {
        ...prev[name as keyof typeof formData],
        [e.target.value]: checked,
      },
    }));
  };

  const handleSubmit = async () => {
    try {
      const db = firebase.firestore();
      const querySnapshot = await db
        .collection('research-listings')
        .where('id', '==', listingData.id)
        .get();

      if (querySnapshot.empty) {
        throw new Error('No matching listing found!');
      }

      const listingRef = querySnapshot.docs[0].ref;
      await listingRef.update(formData);

      alert('Research listing updated!');
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update listing.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Research Listing</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Project Title"
              name="project_title"
              value={formData.project_title || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Department"
              name="department"
              value={formData.department || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Faculty Mentor"
              name="faculty_mentor"
              value={formData.faculty_mentor || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="PhD Student Mentor"
              name="phd_student_mentor"
              value={formData.phd_student_mentor || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Credit"
              name="credit"
              value={formData.credit || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Stipend"
              name="stipend"
              value={formData.stipend || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Website"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Application Requirements"
              name="application_requirements"
              value={formData.application_requirements || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Application Deadline"
              name="application_deadline"
              value={formData.application_deadline || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Project Description"
              name="project_description"
              value={formData.project_description || ''}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Prerequisites"
              name="prerequisites"
              value={formData.prerequisites || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Student Level"
              name="student_level"
              value={formData.student_level || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1">Terms Available</Typography>
            {['spring', 'summer', 'fall'].map((term) => (
              <FormControlLabel
                key={term}
                control={
                  <Checkbox
                    value={term}
                    checked={formData.terms_available?.[term] || false}
                    onChange={handleCheckboxChange}
                    name="terms_available"
                  />
                }
                label={term.charAt(0).toUpperCase() + term.slice(1)}
              />
            ))}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditResearchModal;
