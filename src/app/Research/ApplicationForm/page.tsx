'use client';

import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import firebase from '@/firebase/firebase_config';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';

const ApplicationFormPage = () => {
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
    availableSemesters: [],
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
      await firebase
        .firestore()
        .collection('research-applications')
        .add({
          ...formData,
          uid: user.uid,
          app_status: 'Pending',
          date: new Date().toLocaleDateString(),
        });

      setSubmitted(true);
      setFormData({
        firstname: '',
        lastname: '',
        email: user.email || '',
        phone: '',
        department: '',
        degree: '',
        gpa: '',
        graduationDate: '',
        resume: '',
        qualifications: '',
        weeklyHours: '',
        availableSemesters: [],
      });
    } catch (err) {
      setError('Failed to submit application. Try again.');
      console.error(err);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        Research Application Form
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="First Name"
            name="firstname"
            fullWidth
            value={formData.firstname}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Last Name"
            name="lastname"
            fullWidth
            value={formData.lastname}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Email"
            name="email"
            fullWidth
            disabled
            value={formData.email}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Phone Number"
            name="phone"
            fullWidth
            value={formData.phone}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Department"
            name="department"
            fullWidth
            value={formData.department}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Degree"
            name="degree"
            fullWidth
            value={formData.degree}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="GPA"
            name="gpa"
            fullWidth
            value={formData.gpa}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Graduation Date"
            name="graduationDate"
            fullWidth
            value={formData.graduationDate}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Resume URL"
            name="resume"
            fullWidth
            value={formData.resume}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Qualifications"
            name="qualifications"
            fullWidth
            value={formData.qualifications}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Weekly Hours Available"
            name="weeklyHours"
            fullWidth
            value={formData.weeklyHours}
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      <Button sx={{ mt: 3 }} variant="contained" onClick={handleSubmit}>
        Submit Application
      </Button>

      <Snackbar
        open={submitted}
        autoHideDuration={4000}
        onClose={() => setSubmitted(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Application submitted successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApplicationFormPage;
