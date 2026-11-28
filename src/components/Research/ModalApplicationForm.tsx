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
  MenuItem,
} from '@mui/material';
import { TA_DEPARTMENTS } from '@/component/FormUtil/DepartmentSelect';
import { resolveDepartmentCode } from '@/constants/research';
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

/**
 * Map a profile's department (a code like "ECE" or a full name) onto one of
 * the dropdown options, or '' when it doesn't match any of them.
 */
function toDepartmentOption(raw: string | undefined): string {
  const value = (raw ?? '').trim().toUpperCase();
  const code = (TA_DEPARTMENTS as readonly string[]).includes(value)
    ? value
    : resolveDepartmentCode(raw);
  return code && (TA_DEPARTMENTS as readonly string[]).includes(code)
    ? code
    : '';
}

const PHONE_RE = /^[\d()+\-.\s]{7,20}$/;
const URL_RE = /^https?:\/\/[\w.-]+\.[a-z]{2,}.*$/i;

type FormFields = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  department: string;
  degree: string;
  gpa: string;
  graduationDate: string;
  resume: string;
  qualifications: string;
  weeklyHours: string;
};

type FieldErrors = Partial<Record<keyof FormFields, string>>;

/** Returns an error message per invalid field; empty when the form is valid. */
export function validateResearchApplication(data: FormFields): FieldErrors {
  const errors: FieldErrors = {};

  if (!data.firstname.trim()) errors.firstname = 'First name is required.';
  if (!data.lastname.trim()) errors.lastname = 'Last name is required.';

  const phone = data.phone.trim();
  const phoneDigits = phone.replace(/\D/g, '');
  if (!phone) errors.phone = 'Phone number is required.';
  else if (
    !PHONE_RE.test(phone) ||
    phoneDigits.length < 10 ||
    phoneDigits.length > 15
  )
    errors.phone = 'Enter a valid phone number, e.g. 352-555-1234.';

  if (!data.department) errors.department = 'Select a department.';
  if (!data.degree.trim()) errors.degree = 'Degree is required.';

  const gpa = data.gpa.trim();
  if (!gpa) errors.gpa = 'GPA is required.';
  else if (!/^\d+(\.\d+)?$/.test(gpa) || Number(gpa) < 0 || Number(gpa) > 4)
    errors.gpa = 'GPA must be a number between 0.0 and 4.0.';

  // A partly typed date reports an empty value, so this also catches
  // incomplete dates.
  if (!data.graduationDate)
    errors.graduationDate = 'Graduation date is required.';

  const resume = data.resume.trim();
  if (!resume) errors.resume = 'Resume URL is required.';
  else if (!URL_RE.test(resume))
    errors.resume = 'Enter a full URL starting with http:// or https://.';

  if (!data.qualifications.trim())
    errors.qualifications = 'Please describe your qualifications.';

  const hours = data.weeklyHours.trim();
  if (!hours) errors.weeklyHours = 'Weekly hours are required.';
  else if (!/^\d+$/.test(hours) || Number(hours) < 1 || Number(hours) > 40)
    errors.weeklyHours = 'Enter a whole number of hours between 1 and 40.';

  return errors;
}

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

  const [formData, setFormData] = useState<FormFields>({
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
            phone: String(profileData.phonenumber ?? ''),
            department: toDepartmentOption(profileData.department),
            degree: profileData.degree || '',
            gpa: String(profileData.gpa ?? ''),
            // The date input only accepts YYYY-MM-DD; older profiles may
            // hold free text (e.g. "May 2027"), so drop those.
            graduationDate: /^\d{4}-\d{2}-\d{2}$/.test(
              profileData.graduationdate ?? ''
            )
              ? profileData.graduationdate
              : '',
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
    const name = e.target.name as keyof FormFields;
    setFormData({ ...formData, [name]: e.target.value });
    if (fieldErrors[name]) {
      setFieldErrors(({ [name]: _cleared, ...rest }) => rest);
    }
  };

  // Spreads onto each TextField: binds value/onChange and shows its error.
  const fieldProps = (name: keyof FormFields, helper?: string) => ({
    name,
    value: formData[name],
    onChange: handleChange,
    error: !!fieldErrors[name],
    helperText: fieldErrors[name] ?? helper,
  });

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be signed in to apply.');
      return;
    }
    const errors = validateResearchApplication(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted fields.');
      return;
    }
    setFieldErrors({});

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
                {...fieldProps('firstname')}
                label="First Name"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                {...fieldProps('lastname')}
                label="Last Name"
                fullWidth
                required
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
                {...fieldProps('phone', 'Example: 352-555-1234')}
                type="tel"
                autoComplete="tel"
                label="Phone Number"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                {...fieldProps('department')}
                select
                label="Department"
                fullWidth
                required
              >
                {TA_DEPARTMENTS.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                {...fieldProps('degree')}
                label="Degree"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                {...fieldProps('gpa', 'On a 4.0 scale')}
                inputProps={{ inputMode: 'decimal' }}
                label="GPA"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                {...fieldProps('graduationDate')}
                label="Graduation Date"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...fieldProps('resume')}
                label="Resume URL"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...fieldProps('qualifications')}
                label="Qualifications"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                {...fieldProps('weeklyHours')}
                inputProps={{ inputMode: 'numeric' }}
                label="Weekly Hours"
                fullWidth
                required
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
