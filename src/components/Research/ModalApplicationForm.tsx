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
  Snackbar,
  Alert,
} from '@mui/material';
import { getAuth } from 'firebase/auth';
import firebase from '@/firebase/firebase_config';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  where,
  query,
  documentId,
  getDocs,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

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

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      console.log('🔥 Fetching profile for UID:', user.uid);

      try {
        const db = firebase.firestore();
        const snapshot = await db
          .collection('users') // change users to users_test for profile database
          .where('uid', '==', user.uid) // change uid to userId
          .get();

        if (!snapshot.empty) {
          const profileData = snapshot.docs[0].data();
          console.log('✅ Profile data:', profileData);
          setFormData((prev) => ({
            ...prev,
            firstname: profileData.firstname || '',
            lastname: profileData.lastname || '',
            phone: profileData.phonenumber || '',
            department: profileData.department || '',
            degree: profileData.degree || '',
            gpa: profileData.gpa || '',
            graduationDate: profileData.graduationdate || '',
            resume: '',
            qualifications: '',
            weeklyHours: '',
          }));
        } else {
          console.warn('⚠️ No matching profile found for user.uid');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    if (open && user?.uid) {
      fetchProfileData();
    }
  }, [open, user]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be signed in to apply.');
      return;
    }
    const requiredFields = [
      'firstname',
      'lastname',
      'phone',
      'department',
      'degree',
      'gpa',
      'graduationDate',
      'resume',
      'qualifications',
      'weeklyHours',
    ];

    const missingField = requiredFields.find(
      (field) => !formData[field as keyof typeof formData]
    );
    if (missingField) {
      setError(`Please fill out the ${missingField} field.`);
      return;
    }

    const urlRegex = /^https?:\/\/[\w.-]+\.[a-z]{2,}.*$/i;
    if (!urlRegex.test(formData.resume)) {
      setError('Please enter a valid URL for the resume.');
      return;
    }

    try {
      const db = firebase.firestore();

      // First, update the user profile with any changed form data
      console.log('⏳ Updating user profile if values changed...');
      const userRef = db.collection('users').where('uid', '==', user.uid);
      const userSnapshot = await userRef.get();

      if (!userSnapshot.empty) {
        const userDocRef = userSnapshot.docs[0].ref;
        const userData = userSnapshot.docs[0].data();

        // Check if any profile data has been updated
        const updatedProfileData = {
          firstname:
            formData.firstname !== userData.firstname
              ? formData.firstname
              : userData.firstname,
          lastname:
            formData.lastname !== userData.lastname
              ? formData.lastname
              : userData.lastname,
          phonenumber:
            formData.phone !== userData.phonenumber
              ? formData.phone
              : userData.phonenumber,
          department:
            formData.department !== userData.department
              ? formData.department
              : userData.department,
          degree:
            formData.degree !== userData.degree
              ? formData.degree
              : userData.degree,
          gpa: formData.gpa !== userData.gpa ? formData.gpa : userData.gpa,
          graduationdate:
            formData.graduationDate !== userData.graduationdate
              ? formData.graduationDate
              : userData.graduationdate,
        };

        // Only update fields that have changed
        const fieldsToUpdate = Object.entries(updatedProfileData)
          .filter(([key, value]) => userData[key] !== value)
          .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

        if (Object.keys(fieldsToUpdate).length > 0) {
          await userDocRef.update(fieldsToUpdate);
          console.log('User profile updated with new values');
        } else {
          console.log('No profile updates needed');
        }
      }

      const parentDocRef = doc(db, 'research-listings', listingId);
      const noteColRef = collection(parentDocRef, 'applications');
      const finalFormData = {
        uid: user.uid,
        app_status: 'Pending',
        date: new Date().toLocaleDateString(),
        ...formData,
      };
      await addDoc(noteColRef, finalFormData);
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
                required
                value={formData.firstname}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="lastname"
                label="Last Name"
                fullWidth
                required
                value={formData.lastname}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="email"
                label="Email"
                fullWidth
                required
                value={formData.email}
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="phone"
                label="Phone Number"
                fullWidth
                required
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="department"
                label="Department"
                fullWidth
                required
                value={formData.department}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="degree"
                label="Degree"
                fullWidth
                required
                value={formData.degree}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="gpa"
                label="GPA"
                fullWidth
                required
                value={formData.gpa}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="graduationDate"
                label="Graduation Date"
                fullWidth
                required
                value={formData.graduationDate}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="resume"
                label="Resume URL"
                fullWidth
                required
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="qualifications"
                label="Qualifications"
                fullWidth
                required
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="weeklyHours"
                label="Weekly Hours"
                fullWidth
                required
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
