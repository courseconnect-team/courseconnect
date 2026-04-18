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
} from '@/hooks/useSemesterOptions';
import { callFunction } from '@/firebase/functions/callFunction';

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
  const [names, setNames] = useState<{ raw: string; semester: string }[]>([]);

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

        const allCourses: { raw: string; semester: string }[] = [];

        await Promise.all(
          visibleSems.map(async (semesterId) => {
            const snapshot = await firebase
              .firestore()
              .collection('semesters')
              .doc(semesterId)
              .collection('courses')
              .get();

            snapshot.docs.forEach((doc) => {
              allCourses.push({
                raw: doc.id,
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
          const [courseCode] = raw.split(':');
          return `${courseCode.trim()} (${semester})`;
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

    if (!applicationData.email.includes('ufl.edu')) {
      toast.error('Please enter a valid ufl email!');
      setLoading(false);
      return;
    } else if (applicationData.firstname === '') {
      toast.error('Please enter a valid first name!');
      setLoading(false);
      return;
    } else if (applicationData.lastname === '') {
      toast.error('Please enter a valid last name!');
      setLoading(false);
      return;
    } else if (applicationData.ufid === '') {
      toast.error('Please enter a valid ufid!');
      setLoading(false);
      return;
    } else if (applicationData.phonenumber === '') {
      toast.error('Please enter a valid phone number!');
      setLoading(false);
      return;
    } else if (
      applicationData.degree === null ||
      applicationData.degree === ''
    ) {
      toast.error('Please select a degree!');
      setLoading(false);
      return;
    } else if (
      applicationData.department === null ||
      applicationData.department === ''
    ) {
      toast.error('Please select a department!');
      setLoading(false);
      return;
    } else if (
      applicationData.semesterstatus === null ||
      applicationData.semesterstatus === ''
    ) {
      toast.error('Please select a semester status!');
      setLoading(false);
      return;
    } else if (
      applicationData.resume_link === null ||
      applicationData.resume_link === ''
    ) {
      toast.error('Please provide a resume link!');
      setLoading(false);
      return;
    } else if (
      applicationData.position === null ||
      applicationData.position === ''
    ) {
      toast.error('Please enter a position!');
      setLoading(false);
      return;
    } else if (applicationData.available_hours.length === 0) {
      toast.error('Please enter your available hours!');
      setLoading(false);
      return;
    } else if (applicationData.available_semesters.length === 0) {
      toast.error('Please enter your available semesters!');
      setLoading(false);
      return;
    } else if (coursesArray.length === 0) {
      toast.error('Please enter your courses!');
      setLoading(false);
      return;
    } else {
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
                  autoComplete="email"
                  helperText="Enter your UF email address. Example: gator@ufl.edu"
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
                  helperText="Enter your UFID. Example: 12345678"
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
                  autoComplete="phone-number"
                  helperText="Enter your phone number. Example: 123-456-7890"
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
