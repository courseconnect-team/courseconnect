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
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Checkbox from '@mui/material/Checkbox';
import { callFunction } from '@/firebase/functions/callFunction';
import { modernInputSx } from '@/components/FormStyles';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UFID_RE = /^\d{8}$/;

type FieldErrors = Partial<
  Record<
    | 'firstName'
    | 'lastName'
    | 'ufid'
    | 'email'
    | 'confirmEmail'
    | 'registerTerm'
    | 'coursesComfortable'
    | 'captcha',
    string
  >
>;

const TEACHING_AREAS = [
  'Devices',
  'Electromagnetics & Energy Systems',
  'Electronics',
  'Computer Systems',
  'Digital Design',
  'Signals & Systems',
] as const;

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

  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const clearFieldError = (key: keyof FieldErrors) =>
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

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

    const nextErrors: FieldErrors = {};
    if (!firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!ufid.trim()) nextErrors.ufid = 'UFID is required.';
    else if (!UFID_RE.test(ufid)) nextErrors.ufid = 'UFID must be 8 digits.';
    if (!email.trim()) nextErrors.email = 'Email is required.';
    else if (!EMAIL_RE.test(email))
      nextErrors.email = 'Enter a valid email address.';
    else if (!email.toLowerCase().endsWith('ufl.edu'))
      nextErrors.email = 'Must be a ufl.edu email.';
    if (!confirmEmail.trim())
      nextErrors.confirmEmail = 'Please confirm your email.';
    else if (email !== confirmEmail)
      nextErrors.confirmEmail = 'Emails do not match.';
    if (!registerTerm) nextErrors.registerTerm = 'Please select a term.';
    if (!coursesComfortable.trim())
      nextErrors.coursesComfortable =
        'List at least one course you could teach.';
    if (!captcha) nextErrors.captcha = 'Please confirm you are not a robot.';

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error('Please fix the highlighted fields.');
      setLoading(false);
      return;
    }
    setFieldErrors({});

    // date
    const current = new Date();
    const current_date = `${
      current.getMonth() + 1
    }-${current.getDate()}-${current.getFullYear()}`;

    const applicationData = {
      application_type: 'supervised_teaching' as const,
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

      // Submit application via cloud function
      await callFunction('processApplicationForm', applicationData);

      toast.dismiss(toastId);
      toast.success('Application submitted!');
      setSuccess(true);

      // Navigate to home
      router.push('/');
    } catch (err) {
      console.error('ERROR: Failed to save application:', err);
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
                  autoComplete="given-name"
                  error={!!fieldErrors.firstName}
                  helperText={fieldErrors.firstName ?? ' '}
                  onChange={() => clearFieldError('firstName')}
                  sx={modernInputSx}
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
                  autoComplete="family-name"
                  error={!!fieldErrors.lastName}
                  helperText={fieldErrors.lastName ?? ' '}
                  onChange={() => clearFieldError('lastName')}
                  sx={modernInputSx}
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
                  inputMode="numeric"
                  error={!!fieldErrors.ufid}
                  helperText={fieldErrors.ufid ?? '8-digit UF ID'}
                  onChange={() => clearFieldError('ufid')}
                  sx={modernInputSx}
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
                  type="email"
                  autoComplete="email"
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email ?? 'Example: gator@ufl.edu'}
                  onChange={() => clearFieldError('email')}
                  sx={modernInputSx}
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
                  type="email"
                  error={!!fieldErrors.confirmEmail}
                  helperText={fieldErrors.confirmEmail ?? ' '}
                  onChange={() => clearFieldError('confirmEmail')}
                  sx={modernInputSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="phdAdmissionTerm"
                  variant="filled"
                  fullWidth
                  id="phdAdmissionTerm"
                  label="PhD Admission Term"
                  helperText="e.g. Fall 2023"
                  sx={modernInputSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="phdAdvisor"
                  variant="filled"
                  fullWidth
                  id="phdAdvisor"
                  label="PhD Faculty Advisor"
                  helperText=" "
                  sx={modernInputSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Admitted to candidacy? (registered for EEL 7980 hours)
                </Typography>
                <RadioGroup row name="admittedToCandidacy">
                  <FormControlLabel
                    value="Yes"
                    control={<Radio size="small" />}
                    label="Yes"
                  />
                  <FormControlLabel
                    value="No"
                    control={<Radio size="small" />}
                    label="No"
                  />
                </RadioGroup>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  name="registerTerm"
                  variant="filled"
                  fullWidth
                  id="registerTerm"
                  label="Which term to register for EEL 6940"
                  defaultValue=""
                  SelectProps={{ displayEmpty: true }}
                  error={!!fieldErrors.registerTerm}
                  helperText={fieldErrors.registerTerm ?? ' '}
                  onChange={() => clearFieldError('registerTerm')}
                  sx={modernInputSx}
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
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Previously registered for EEL 6940?
                </Typography>
                <RadioGroup row name="previouslyRegistered">
                  <FormControlLabel
                    value="Yes"
                    control={<Radio size="small" />}
                    label="Yes"
                  />
                  <FormControlLabel
                    value="No"
                    control={<Radio size="small" />}
                    label="No"
                  />
                </RadioGroup>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="previousDetails"
                  variant="filled"
                  fullWidth
                  id="previousDetails"
                  label="If so, which semester/course/who did you help?"
                  helperText=" "
                  sx={modernInputSx}
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
                  error={!!fieldErrors.coursesComfortable}
                  helperText={fieldErrors.coursesComfortable ?? ' '}
                  onChange={() => clearFieldError('coursesComfortable')}
                  sx={modernInputSx}
                />
              </Grid>

              {(
                [
                  ['first', teachingFirstChoice, setTeachingFirstChoice],
                  ['second', teachingSecondChoice, setTeachingSecondChoice],
                  ['third', teachingThirdChoice, setTeachingThirdChoice],
                ] as const
              ).map(([key, value, setValue]) => (
                <Grid item xs={12} sm={4} key={key}>
                  <FormControl fullWidth variant="filled" sx={modernInputSx}>
                    <InputLabel id={`teaching-${key}-label`}>
                      Teaching {key[0].toUpperCase() + key.slice(1)} Choice
                    </InputLabel>
                    <Select
                      labelId={`teaching-${key}-label`}
                      id={`teaching${key[0].toUpperCase() + key.slice(1)}`}
                      value={value}
                      label={`Teaching ${
                        key[0].toUpperCase() + key.slice(1)
                      } Choice`}
                      onChange={(e: SelectChangeEvent) =>
                        setValue(e.target.value as string)
                      }
                    >
                      <MenuItem value="">Select</MenuItem>
                      {TEACHING_AREAS.map((area) => (
                        <MenuItem key={area} value={area}>
                          {area}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ))}

              <Grid item xs={12}>
                <FormControl error={!!fieldErrors.captcha}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="captcha"
                        onChange={() => clearFieldError('captcha')}
                      />
                    }
                    label="I am not a robot"
                  />
                  {fieldErrors.captcha && (
                    <FormHelperText>{fieldErrors.captcha}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: '#6739B7',
                    px: 3,
                    py: 1.25,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#522DA8' },
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
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
