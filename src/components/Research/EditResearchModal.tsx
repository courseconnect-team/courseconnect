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
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyName, setFacultyName] = useState('');

  useEffect(() => {
    setFormData({ ...listingData });
  }, [listingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));
  };

  /** Adds a faculty mentor to the map. */
  const handleAddFacultyMentor = () => {
    if (facultyEmail && facultyName) {
      setFormData((prev) => ({
        ...prev,
        faculty_mentor: {
          ...prev.faculty_mentor,
          [facultyEmail]: facultyName,
        },
      }));
      setFacultyEmail('');
      setFacultyName('');
    }
  };

  /** Removes a faculty mentor from the map. */
  const handleRemoveFacultyMentor = (email: string) => {
    setFormData((prev) => {
      const updatedMentors = { ...prev.faculty_mentor };
      delete updatedMentors[email];
      return { ...prev, faculty_mentor: updatedMentors };
    });
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
      <DialogContent
        sx={{
          maxHeight: '70vh', // Adjust the height as needed
          overflowY: 'auto', // Enables scrolling
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sx={{ marginTop: 2 }}>
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

          {/* Faculty Mentor */}
          <Grid item xs={12}>
            <Typography variant="subtitle1">Faculty Mentors</Typography>
            <TextField
              label="Faculty Mentor Email"
              value={facultyEmail}
              onChange={(e) => setFacultyEmail(e.target.value)}
              fullWidth
              margin="dense"
            />
            <TextField
              label="Faculty Mentor Name"
              value={facultyName}
              onChange={(e) => setFacultyName(e.target.value)}
              fullWidth
              margin="dense"
            />
            <Button
              onClick={handleAddFacultyMentor}
              sx={{
                textTransform: 'none',
                color: '#5A41D8',
                fontWeight: 500,
                marginTop: '8px',
              }}
            >
              Add Faculty Mentor
            </Button>
            <Grid container spacing={1} sx={{ marginTop: '8px' }}>
              {formData.faculty_mentor &&
                Object.entries(formData.faculty_mentor).map(([email, name]) => (
                  <Grid item xs={12} key={email}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        {name} ({email})
                      </span>
                      <Button
                        onClick={() => handleRemoveFacultyMentor(email)}
                        sx={{
                          textTransform: 'none',
                          color: '#D32F2F',
                          fontWeight: 500,
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </Grid>
                ))}
            </Grid>
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
