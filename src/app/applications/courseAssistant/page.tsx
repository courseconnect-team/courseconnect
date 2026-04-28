'use client';
import * as React from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import DepartmentSelect from '@/component/FormUtil/DepartmentSelect';
import GPA_Select from '@/component/FormUtil/GPASelect';
import Typography from '@mui/material/Typography';
import DegreeSelect from '@/component/FormUtil/DegreeSelect';
import SemesterStatusSelect from '@/component/FormUtil/SemesterStatusSelect';
import PositionSelect from '@/component/FormUtil/PositionSelect';
import AvailabilityCheckbox from '@/component/FormUtil/AvailabilityCheckbox';
import AdditionalSemesterPrompt from '@/component/FormUtil/AddtlSemesterPrompt';
import UpdateRole from '@/firebase/util/UpdateUserRole';
import { useAuth } from '@/firebase/auth/auth_context';
import { Toaster, toast } from 'react-hot-toast';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import 'firebase/firestore';
import firebase from '@/firebase/firebase_config';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import {
  fetchClosestSemesters,
  parseCoursesMinimal,
  CourseOption,
  CourseMinimalInput,
} from '@/hooks/useSemesterOptions';
import { callFunction } from '@/firebase/functions/callFunction';
import { modernInputSx } from '@/components/FormStyles';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d()+\-\s]{7,20}$/;
const UFID_RE = /^\d{8}$/;

type FieldErrors = Partial<
  Record<
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'ufid'
    | 'phone'
    | 'resumeLink'
    | 'qualifications',
    string
  >
>;

export default function Application() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user.uid;

  const current = new Date();
  const current_date = `${
    current.getMonth() + 1
  }-${current.getDate()}-${current.getFullYear()}`;

  const [nationality, setNationality] = React.useState<string | null>(null);
  const [additionalPromptValue, setAdditionalPromptValue] = React.useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = React.useState(false);

  const [selectedCourses, setSelectedCourses] = React.useState<string[]>([]);
  const [names, setNames] = useState<CourseMinimalInput[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearFieldError = (key: keyof FieldErrors) =>
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const handleAdditionalPromptChange = (newValue: string) => {
    setAdditionalPromptValue(newValue);
  };

  React.useEffect(() => {
    async function fetchData() {
      try {
        const candidateSems = await fetchClosestSemesters(3);

        const semesterDocs = await Promise.all(
          candidateSems.map((semesterId) =>
            firebase.firestore().collection('semesters').doc(semesterId).get()
          )
        );

        const visibleSems = semesterDocs
          .filter((doc) => doc.exists && doc.data()?.hidden === false)
          .map((doc) => doc.id);

        const allCourses: CourseMinimalInput[] = [];

        await Promise.all(
          visibleSems.map(async (semesterId) => {
            const snapshot = await firebase
              .firestore()
              .collection('semesters')
              .doc(semesterId)
              .collection('courses')
              .get();

            snapshot.docs.forEach((doc) => {
              const d = doc.data() as {
                code?: string;
                codeWithSpace?: string;
                class_number?: string;
                classNumber?: string;
                professor_names?: string;
                instructor?: string;
              };
              const code = String(d.code ?? '')
                .trim()
                .toUpperCase();
              const instructor = String(
                d.professor_names ?? d.instructor ?? ''
              ).trim();
              const classNumber = String(
                d.class_number ?? d.classNumber ?? ''
              ).trim();
              // Doc id is `${code} : ${instructor}`; instructor is the
              // identifying field. Skip rows missing both code and an
              // instructor — those can't be picker options.
              if (!code || !instructor) return;
              allCourses.push({
                code,
                classNumber,
                instructor,
                codeWithSpace: d.codeWithSpace,
                semester: semesterId,
              });
            });
          })
        );

        setNames(allCourses);
      } catch (err) {
        console.log(err);
      }
    }

    fetchData();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const handleSendEmail = async (applicationData: {
      email: string;
      position: string;
    }) => {
      try {
        const courseNamesWithSemester = selectedCourses.map((course) => {
          const [semester, raw] = course.split('|||');
          // Doc id is `${code} : ${instructor}` — peel off the code.
          // Fall back to legacy `${code}__${classNumber}` for any picker
          // entries built before the (code, instructor) unification.
          const code = raw.split(' : ')[0] ?? raw.split('__')[0] ?? raw;
          return `${code.trim()} (${semester})`;
        });

        const resultString = courseNamesWithSemester.join(', ');

        await callFunction('sendEmail', {
          type: 'applicationConfirmation',
          data: {
            user: {
              name: user.displayName,
              email: applicationData.email,
            },
            position: applicationData.position,
            classCode: resultString,
          },
        });
      } catch (error) {
        console.error('Error sending email:', error);
      }
    };

    setLoading(true);
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const availabilityCheckbox_seven =
      formData.get('availabilityCheckbox_seven') === 'on';
    const availabilityCheckbox_fourteen =
      formData.get('availabilityCheckbox_fourteen') === 'on';
    const availabilityCheckbox_twenty =
      formData.get('availabilityCheckbox_twenty') === 'on';

    const availabilityArray: string[] = [];
    if (availabilityCheckbox_seven) availabilityArray.push('7');
    if (availabilityCheckbox_fourteen) availabilityArray.push('14');
    if (availabilityCheckbox_twenty) availabilityArray.push('20');

    const semesterArray: string[] = [];
    semesterArray.push(...(await fetchClosestSemesters(3)));

    const coursesArray = selectedCourses;

    // Canonical nested shape: courses[semester][courseId] = status.
    // selectedCourses entries are encoded as `${semester}|||${courseId}`
    // (see useSemesterOptions.parseCoursesMinimal); split them back out
    // here so they're stored cleanly.
    const coursesMap: Record<
      string,
      Record<string, 'applied' | 'approved' | 'denied' | 'accepted'>
    > = {};
    for (const encoded of coursesArray) {
      const sepIdx = encoded.indexOf('|||');
      const sem = sepIdx === -1 ? '' : encoded.slice(0, sepIdx);
      const courseId = sepIdx === -1 ? encoded : encoded.slice(sepIdx + 3);
      if (!coursesMap[sem]) coursesMap[sem] = {};
      coursesMap[sem][courseId] = 'applied';
    }

    const applicationData = {
      application_type: 'course_assistant' as const,
      firstname: formData.get('firstName') as string,
      lastname: formData.get('lastName') as string,
      email: formData.get('email') as string,
      ufid: formData.get('ufid') as string,
      phonenumber: formData.get('phone-number') as string,
      gpa: formData.get('gpa-select') as string,
      department: formData.get('department-select') as string,
      degree: formData.get('degrees-radio-group') as string,
      semesterstatus: formData.get('semstatus-radio-group') as string,
      additionalprompt: additionalPromptValue,
      nationality: nationality as string,
      englishproficiency: 'NA',
      position: formData.get('positions-radio-group') as string,
      available_hours: availabilityArray as string[],
      available_semesters: semesterArray as string[],
      courses: coursesMap,
      qualifications: formData.get('qualifications-prompt') as string,
      uid: userId,
      date: current_date,
      status: 'Submitted',
      resume_link: formData.get('resumeLink') as string,
    };

    const nextErrors: FieldErrors = {};
    if (!applicationData.firstname.trim())
      nextErrors.firstName = 'First name is required.';
    if (!applicationData.lastname.trim())
      nextErrors.lastName = 'Last name is required.';
    if (!applicationData.email.trim()) nextErrors.email = 'Email is required.';
    else if (!EMAIL_RE.test(applicationData.email))
      nextErrors.email = 'Enter a valid email address.';
    else if (!applicationData.email.toLowerCase().endsWith('ufl.edu'))
      nextErrors.email = 'Must be a ufl.edu email.';
    if (!applicationData.ufid.trim()) nextErrors.ufid = 'UFID is required.';
    else if (!UFID_RE.test(applicationData.ufid))
      nextErrors.ufid = 'UFID must be 8 digits.';
    if (!applicationData.phonenumber.trim())
      nextErrors.phone = 'Phone number is required.';
    else if (!PHONE_RE.test(applicationData.phonenumber))
      nextErrors.phone = 'Enter a valid phone number.';
    if (!applicationData.resume_link?.trim())
      nextErrors.resumeLink = 'Resume link is required.';
    else if (!/^https?:\/\//.test(applicationData.resume_link))
      nextErrors.resumeLink = 'Must be a full URL (starts with http/https).';
    if (!applicationData.qualifications?.trim())
      nextErrors.qualifications = 'Please describe your qualifications.';

    const dropdownMsg: string[] = [];
    if (!applicationData.degree) dropdownMsg.push('degree');
    if (!applicationData.department) dropdownMsg.push('department');
    if (!applicationData.semesterstatus) dropdownMsg.push('semester status');
    if (!applicationData.position) dropdownMsg.push('position');
    if (applicationData.available_hours.length === 0)
      dropdownMsg.push('available hours');
    if (coursesArray.length === 0) dropdownMsg.push('at least one course');

    if (Object.keys(nextErrors).length > 0 || dropdownMsg.length > 0) {
      setFieldErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        toast.error('Please fix the highlighted fields.');
      }
      if (dropdownMsg.length > 0) {
        toast.error(`Please select: ${dropdownMsg.join(', ')}.`);
      }
      setLoading(false);
      return;
    }

    setFieldErrors({});
    {
      const toastId = toast.loading('Processing application', {
        duration: 30000,
      });

      try {
        await firebase
          .firestore()
          .collection('assignments')
          .doc(userId)
          .delete();
      } catch (err) {
        console.log('No prior assignment doc to delete or delete failed:', err);
      }

      try {
        // Submit application via cloud function
        await callFunction('processApplicationForm', applicationData);

        await handleSendEmail({
          email: applicationData.email,
          position: applicationData.position,
        });

        toast.dismiss(toastId);
        toast.success('Application submitted!');
        console.log('SUCCESS: Application data saved successfully');

        await UpdateRole(userId, 'student_applied');
        router.push('/');
      } catch (error) {
        toast.dismiss(toastId);
        toast.error('Application submission failed!');
        console.error('ERROR: Failed to save application:', error);
      }

      setLoading(false);
    }
  };

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

  const courseOptions = parseCoursesMinimal(names);

  return (
    <>
      <HeaderCard title="Application">
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

        <Snackbar
          open={success}
          autoHideDuration={3000}
          onClose={handleSuccess}
        >
          <Alert severity="success" sx={{ width: '100%' }}>
            Application submitted successfully!
          </Alert>
        </Snackbar>

        <CssBaseline />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Grid item xs={12} sm={6}>
              <Typography align="center" component="h2" variant="h6">
                Personal Information
              </Typography>
            </Grid>

            <br />

            <Grid container spacing={2} sx={{ marginTop: 0 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  variant="filled"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                  error={!!fieldErrors.firstName}
                  helperText={fieldErrors.firstName ?? ' '}
                  onChange={() => clearFieldError('firstName')}
                  sx={modernInputSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  variant="filled"
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  error={!!fieldErrors.lastName}
                  helperText={fieldErrors.lastName ?? ' '}
                  onChange={() => clearFieldError('lastName')}
                  sx={modernInputSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  variant="filled"
                  id="email"
                  label="Email Address"
                  name="email"
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
                  required
                  fullWidth
                  variant="filled"
                  id="ufid"
                  label="UFID"
                  name="ufid"
                  inputMode="numeric"
                  error={!!fieldErrors.ufid}
                  helperText={fieldErrors.ufid ?? '8-digit UF ID'}
                  onChange={() => clearFieldError('ufid')}
                  sx={modernInputSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  variant="filled"
                  name="phone-number"
                  label="Phone Number"
                  type="tel"
                  id="phone-number"
                  autoComplete="tel"
                  error={!!fieldErrors.phone}
                  helperText={fieldErrors.phone ?? 'Example: 123-456-7890'}
                  onChange={() => clearFieldError('phone')}
                  sx={modernInputSx}
                />
              </Grid>

              <Grid
                item
                xs={22}
                sm={116}
                justifyContent="center"
                alignItems="center"
              >
                <DepartmentSelect />
              </Grid>

              <Grid item xs={12} sm={6}>
                <SemesterStatusSelect
                  component={AdditionalSemesterPrompt}
                  onValueChange={handleAdditionalPromptChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DegreeSelect />
              </Grid>
            </Grid>

            <br />

            <Typography
              align="center"
              component="h2"
              variant="h6"
              sx={{ m: 1 }}
            >
              Position Information
            </Typography>

            <br />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography>
                  Please select the position for which you are interested in
                  applying.
                </Typography>
                <PositionSelect />
              </Grid>

              <Grid item xs={12}>
                <Typography>
                  Please select one or more options describing the number of
                  hours per week you will be available.
                </Typography>
                <AvailabilityCheckbox name="availabilityCheckbox" />
              </Grid>

              <Grid item xs={12}>
                <Typography>
                  Please list the course(s) for which you are applying. Ensure
                  that you select the courses with your desired semester and
                  instructor.
                </Typography>
                <br />
                <FormControl variant="filled" fullWidth>
                  <Autocomplete<CourseOption, true, false, false>
                    multiple
                    disableCloseOnSelect
                    options={[...courseOptions].sort((a, b) =>
                      a.code.localeCompare(b.code)
                    )}
                    groupBy={(o) => o.department}
                    getOptionLabel={(o) => o.name}
                    value={courseOptions.filter((o) =>
                      selectedCourses.includes(o.value)
                    )}
                    onChange={(_, vals) =>
                      setSelectedCourses(vals.map((v) => v.value))
                    }
                    isOptionEqualToValue={(opt, val) => opt.value === val.value}
                    renderInput={(params) => (
                      <TextField {...params} label="Course(s)*" />
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography>
                  Please provide your most recently calculated cumulative UF
                  GPA.
                </Typography>
                <br />
                <GPA_Select />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ paddingBottom: 2 }}>
                  Please upload a google drive link to your resume.
                </Typography>
                <TextField
                  required
                  fullWidth
                  variant="filled"
                  id="resumeLink"
                  label="Resume Link"
                  name="resumeLink"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  error={!!fieldErrors.resumeLink}
                  helperText={
                    fieldErrors.resumeLink ??
                    'Paste a shareable Google Drive link.'
                  }
                  onChange={() => clearFieldError('resumeLink')}
                  sx={modernInputSx}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography>
                  Please describe your qualifications for the position and
                  course(s) for which you are applying. <br />
                  <em>
                    If you have been a TA, UPI, or grader before, please mention
                    the course(s) and teacher(s) for which you worked.
                  </em>{' '}
                  <br />
                  <br />
                  Write about any relevant experience, such as teaching,
                  tutoring, grading, or coursework. <br />
                </Typography>
                <TextField
                  required
                  fullWidth
                  id="qualifications-prompt"
                  name="qualifications-prompt"
                  label="I am qualified because..."
                  multiline
                  rows={8}
                  variant="filled"
                  error={!!fieldErrors.qualifications}
                  helperText={fieldErrors.qualifications ?? ' '}
                  onChange={() => clearFieldError('qualifications')}
                  sx={modernInputSx}
                />
              </Grid>

              <Grid item xs={12}></Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </Box>
      </HeaderCard>
    </>
  );
}
