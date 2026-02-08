'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuth } from '@/firebase/auth/auth_context';
import { Toaster, toast } from 'react-hot-toast';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import firebase from '@/firebase/firebase_config';
import { useRouter } from 'next/navigation';
import { fetchClosestSemesters } from '@/hooks/useSemesterOptions';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

export default function SupervisedTeachingApplication() {
  const { user } = useAuth();
  const userId = user?.uid || '';
  const router = useRouter();

  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Teaching choices (dropdowns)
  const [teachingFirstChoice, setTeachingFirstChoice] = React.useState('');
  const [teachingSecondChoice, setTeachingSecondChoice] = React.useState('');
  const [teachingThirdChoice, setTeachingThirdChoice] = React.useState('');

  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  const handleSuccess = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') return;
    setSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const firstName = (formData.get('firstName') as string) || '';
    const lastName = (formData.get('lastName') as string) || '';
    const ufid = (formData.get('ufid') as string) || '';
    const email = (formData.get('email') as string) || '';
    const confirmEmail = (formData.get('confirmEmail') as string) || '';
    const phdAdmissionTerm = (formData.get('phdAdmissionTerm') as string) || '';
    const phdAdvisor = (formData.get('phdAdvisor') as string) || '';
    const admittedToCandidacy =
      (formData.get('admittedToCandidacy') as string) || '';
    const registerTerm = (formData.get('registerTerm') as string) || '';
    const previouslyRegistered =
      (formData.get('previouslyRegistered') as string) || '';
    const previousDetails = (formData.get('previousDetails') as string) || '';
    const coursesComfortable =
      (formData.get('coursesComfortable') as string) || '';
    // teaching choices come from Select state
    const teachingFirst = teachingFirstChoice || '';
    const teachingSecond = teachingSecondChoice || '';
    const teachingThird = teachingThirdChoice || '';
    const captcha = formData.get('captcha') === 'on';

    // basic validations
    if (!email.includes('ufl.edu')) {
      toast.error('Please enter a valid GatorLink (ufl.edu) email');
      setLoading(false);
      return;
    }
    if (email !== confirmEmail) {
      toast.error('Email and Confirm Email must match');
      setLoading(false);
      return;
    }
    if (!firstName || !lastName || !ufid) {
      toast.error('Please complete all required personal fields');
      setLoading(false);
      return;
    }
    if (!registerTerm) {
      toast.error('Please select the term you want to register for EEL 6940');
      setLoading(false);
      return;
    }
    if (!coursesComfortable) {
      toast.error('Please list at least one course you could teach');
      setLoading(false);
      return;
    }
    if (!captcha) {
      toast.error('Please complete the CAPTCHA confirmation');
      setLoading(false);
      return;
    }

    // date
    const current = new Date();
    const current_date = `${
      current.getMonth() + 1
    }-${current.getDate()}-${current.getFullYear()}`;

    const applicationData = {
      application_type: 'supervised_teaching',
      firstname: firstName,
      lastname: lastName,
      ufid,
      email,
      phdAdmissionTerm,
      phdAdvisor,
      admittedToCandidacy,
      registerTerm,
      previouslyRegistered,
      previousDetails,
      coursesComfortable,
      teachingFirst,
      teachingSecond,
      teachingThird,
      uid: userId,
      date: current_date,
      status: 'Submitted',
    };

    try {
      const toastId = toast.loading('Submitting application...');
      const response = await fetch(
        'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/processApplicationForm',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(applicationData),
        }
      );

      if (response.ok) {
        toast.dismiss(toastId);
        toast.success('Application submitted!');
        setSuccess(true);
        // optional: update role or navigate
        router.push('/');
      } else {
        toast.dismiss(toastId);
        toast.error('Submission failed. Please try again later.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Submission failed. Please try again later.');
    }

    setLoading(false);
  };

  const [visibleSems, setVisibleSems] = React.useState<string[]>([]);
  React.useEffect(() => {
    async function load() {
      const sems = await fetchClosestSemesters(3);
      setVisibleSems(sems);
    }
    load();
  }, []);

  return (
    <HeaderCard title="Supervised Teaching">
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

      <Grid container>
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            ECE Ph.D. students may register for EEL 6940 Supervised Teaching to
            fulfill professional development requirements. Deadlines:
          </Typography>
          <ul className="list-disc ml-6 mb-4 text-sm">
            <li>Fall Semester — August 2</li>
            <li>Spring Semester — January 2</li>
            <li>Summer Semester — April 30</li>
          </ul>

          <CssBaseline />
          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ marginTop: 0 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  variant="filled"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  variant="filled"
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="ufid"
                  variant="filled"
                  required
                  fullWidth
                  id="ufid"
                  label="UFID"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  variant="filled"
                  required
                  fullWidth
                  id="email"
                  label="UF Email Address"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="confirmEmail"
                  variant="filled"
                  required
                  fullWidth
                  id="confirmEmail"
                  label="Confirm Email"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="phdAdmissionTerm"
                  variant="filled"
                  fullWidth
                  id="phdAdmissionTerm"
                  label="PhD Admission Term"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="phdAdvisor"
                  variant="filled"
                  fullWidth
                  id="phdAdvisor"
                  label="PhD Faculty Advisor"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">
                  Admitted to candidacy? (registered for EEL 7980 hours)
                </Typography>
                <div>
                  <label>
                    <input
                      type="radio"
                      name="admittedToCandidacy"
                      value="Yes"
                    />{' '}
                    Yes
                  </label>
                  <span style={{ marginLeft: 12 }} />
                  <label>
                    <input type="radio" name="admittedToCandidacy" value="No" />{' '}
                    No
                  </label>
                </div>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  name="registerTerm"
                  variant="filled"
                  fullWidth
                  id="registerTerm"
                  label="Which term to register for EEL 6940"
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">Select term</MenuItem>
                  {visibleSems.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">
                  Previously registered for EEL 6940?
                </Typography>
                <div>
                  <label>
                    <input
                      type="radio"
                      name="previouslyRegistered"
                      value="Yes"
                    />{' '}
                    Yes
                  </label>
                  <span style={{ marginLeft: 12 }} />
                  <label>
                    <input
                      type="radio"
                      name="previouslyRegistered"
                      value="No"
                    />{' '}
                    No
                  </label>
                </div>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="previousDetails"
                  variant="filled"
                  fullWidth
                  id="previousDetails"
                  label="If so, which semester/course/who did you help?"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="coursesComfortable"
                  variant="filled"
                  required
                  fullWidth
                  multiline
                  minRows={2}
                  id="coursesComfortable"
                  label="Course(s) you would be comfortable teaching"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="filled">
                  <InputLabel id="teaching-first-label">
                    Teaching First Choice
                  </InputLabel>
                  <Select
                    labelId="teaching-first-label"
                    id="teachingFirst"
                    value={teachingFirstChoice}
                    label="Teaching First Choice"
                    onChange={(e: SelectChangeEvent) =>
                      setTeachingFirstChoice(e.target.value as string)
                    }
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Devices">Devices</MenuItem>
                    <MenuItem value="Electromagnetics & Energy Systems">
                      Electromagnetics & Energy Systems
                    </MenuItem>
                    <MenuItem value="Electronics">Electronics</MenuItem>
                    <MenuItem value="Computer Systems">
                      Computer Systems
                    </MenuItem>
                    <MenuItem value="Digital Design">Digital Design</MenuItem>
                    <MenuItem value="Signals & Systems">
                      Signals & Systems
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="filled">
                  <InputLabel id="teaching-second-label">
                    Teaching Second Choice
                  </InputLabel>
                  <Select
                    labelId="teaching-second-label"
                    id="teachingSecond"
                    value={teachingSecondChoice}
                    label="Teaching Second Choice"
                    onChange={(e: SelectChangeEvent) =>
                      setTeachingSecondChoice(e.target.value as string)
                    }
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Devices">Devices</MenuItem>
                    <MenuItem value="Electromagnetics & Energy Systems">
                      Electromagnetics & Energy Systems
                    </MenuItem>
                    <MenuItem value="Electronics">Electronics</MenuItem>
                    <MenuItem value="Computer Systems">
                      Computer Systems
                    </MenuItem>
                    <MenuItem value="Digital Design">Digital Design</MenuItem>
                    <MenuItem value="Signals & Systems">
                      Signals & Systems
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="filled">
                  <InputLabel id="teaching-third-label">
                    Teaching Third Choice
                  </InputLabel>
                  <Select
                    labelId="teaching-third-label"
                    id="teachingThird"
                    value={teachingThirdChoice}
                    label="Teaching Third Choice"
                    onChange={(e: SelectChangeEvent) =>
                      setTeachingThirdChoice(e.target.value as string)
                    }
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Devices">Devices</MenuItem>
                    <MenuItem value="Electromagnetics & Energy Systems">
                      Electromagnetics & Energy Systems
                    </MenuItem>
                    <MenuItem value="Electronics">Electronics</MenuItem>
                    <MenuItem value="Computer Systems">
                      Computer Systems
                    </MenuItem>
                    <MenuItem value="Digital Design">Digital Design</MenuItem>
                    <MenuItem value="Signals & Systems">
                      Signals & Systems
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <label>
                  <input type="checkbox" name="captcha" /> I am not a robot
                </label>
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button type="submit" variant="contained" disabled={loading}>
                  Submit Request
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>

      <Snackbar open={success} autoHideDuration={3000} onClose={handleSuccess}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Application submitted successfully!
        </Alert>
      </Snackbar>
    </HeaderCard>
  );
}
