'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { getAuth } from 'firebase/auth';
import firebase from '@/firebase/firebase_config';

interface ModalApplicationFormProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
}

const ModalApplicationForm: React.FC<ModalApplicationFormProps> = ({
  open,
  onClose,
  listingId,
}) => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: user?.email || '',
    phone: '',
    department: '',
    degree: '',
    gpa: '',
    graduationDate: '',
    resume: '',
    qualifications: '',
    weeklyHours: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be signed in to apply.');
      return;
    }

    try {
      const db = firebase.firestore();

      console.log('⏳ Trying to add application to research-applications...');
      const applicationRef = await db.collection('research-applications').add({
        ...formData,
        uid: user.uid,
        app_status: 'Pending',
        date: new Date().toLocaleDateString(),
      });
      console.log('✅ Application added');

      const appId = applicationRef.id;

      console.log('📎 Linking appId to research-listings...');
      const listingRef = db.collection('research-listings').doc(listingId);
      await listingRef.update({
        applications: firebase.firestore.FieldValue.arrayUnion(appId),
      });

      console.log('✅ App linked to listing');
      alert('Application submitted successfully!');
      setSubmitted(true);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        console.error('🔥 Submission failed:', err.message);
        alert('Submission failed: ' + err.message);
      } else {
        console.error('🔥 Submission failed with unknown error:', err);
        alert('Submission failed. Unknown error occurred.');
      }

      setError('Submission failed. Please try again.');
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Apply for Research Position</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                name="firstname"
                label="First Name"
                fullWidth
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="lastname"
                label="Last Name"
                fullWidth
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="email"
                label="Email"
                fullWidth
                value={formData.email}
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="phone"
                label="Phone Number"
                fullWidth
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="department"
                label="Department"
                fullWidth
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="degree"
                label="Degree"
                fullWidth
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="gpa"
                label="GPA"
                fullWidth
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="graduationDate"
                label="Graduation Date"
                fullWidth
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="resume"
                label="Resume URL"
                fullWidth
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="qualifications"
                label="Qualifications"
                fullWidth
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="weeklyHours"
                label="Weekly Hours"
                fullWidth
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={submitted}
        autoHideDuration={3000}
        onClose={() => setSubmitted(false)}
      >
        <Alert severity="success">Application submitted!</Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError('')}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </>
  );
};

export default ModalApplicationForm;
