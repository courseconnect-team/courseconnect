'use client';
import * as React from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import DepartmentSelect from '@/components/FormUtil/DepartmentSelect';
import GPA_Select from '@/components/FormUtil/GPASelect';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import DegreeSelect from '@/components/FormUtil/DegreeSelect';
import SemesterStatusSelect from '@/components/FormUtil/SemesterStatusSelect';
import PositionSelect from '@/components/FormUtil/PositionSelect';
import AvailabilityCheckbox from '@/components/FormUtil/AvailabilityCheckbox';
import AdditionalSemesterPrompt from '@/components/FormUtil/AddtlSemesterPrompt';
import UpdateRole from '@/firebase/util/UpdateUserRole';
import { useAuth } from '@/firebase/auth/auth_context';
import { Toaster, toast } from 'react-hot-toast';
import { FilledInput } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import 'firebase/firestore';
import firebase from '@/firebase/firebase_config';
import { useState } from 'react';
import { TopNavBarSigned } from '@/components/TopNavBarSigned/TopNavBarSigned';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';
import Chip from '@mui/material/Chip';
import styles from './style.module.css';
import { useRouter } from 'next/navigation';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import HeaderCard from '@/components/HeaderCard/HeaderCard';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

// note that the application needs to be able to be connected to a specific faculty member
// so that the faculty member can view the application and accept/reject it
// the user can indicate whether or not it is unspecified I suppose?
// but that would leave a little bit of a mess.
// best to parse the existing courses and then have the user select
// from a list of existing courses
// ...yeah that's probably the best way to do it
export default function Application() {
  // get the current user's uid
  const router = useRouter();
  const { user } = useAuth();
  const userId = user.uid;

  // get the current date in month/day/year format
  const current = new Date();
  const current_date = `${
    current.getMonth() + 1
  }-${current.getDate()}-${current.getFullYear()}`;

  // extract the nationality
  const [nationality, setNationality] = React.useState<string | null>(null);

  const [additionalPromptValue, setAdditionalPromptValue] = React.useState('');
  const handleAdditionalPromptChange = (newValue: string) => {
    setAdditionalPromptValue(newValue);
  };
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const handleSendEmail = async () => {
      try {
        let courseNamesWithSemester = coursesArray.map((course) => {
          let parts = course.split(' :');
          let courseNameWithSemester = parts[0].trim();
          return courseNameWithSemester; // Get the first part and trim any extra spaces
        });
        let resultString = courseNamesWithSemester.join(', ');

        const response = await fetch(
          'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/sendEmail',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'applicationConfirmation',
              data: {
                user: {
                  name: user.displayName,
                  email: applicationData.email,
                },
                position: applicationData.position,
                classCode: resultString,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('Email sent successfully:', data);
        } else {
          throw new Error('Failed to send email');
        }
      } catch (error) {
        console.error('Error sending email:', error);
      }
    };

    setLoading(true);
    event.preventDefault();
    // extract the form data from the current event
    const formData = new FormData(event.currentTarget);

    // extract availability checkbox's values
    const availabilityCheckbox_seven =
      formData.get('availabilityCheckbox_seven') === 'on';
    const availabilityCheckbox_fourteen =
      formData.get('availabilityCheckbox_fourteen') === 'on';
    const availabilityCheckbox_twenty =
      formData.get('availabilityCheckbox_twenty') === 'on';

    const availabilityArray: string[] = [];
    if (availabilityCheckbox_seven) {
      availabilityArray.push('7');
    }
    if (availabilityCheckbox_fourteen) {
      availabilityArray.push('14');
    }
    if (availabilityCheckbox_twenty) {
      availabilityArray.push('20');
    }

    // extract semester checkbox's values
    const semesterCheckbox_fall_2023 =
      formData.get('semesterCheckbox_fall_2024') === 'on';
    const semesterCheckbox_spring_2024 =
      formData.get('semesterCheckbox_spring_2025') === 'on';

    const semesterArray: string[] = [];

    let f24 = false;
    let s25 = false;
    for (let i = 0; i < personName.length; i++) {
      if (personName[i].includes('Fall 2024')) {
        f24 = true;
      }
      if (personName[i].includes('Spring 2025')) {
        s25 = true;
      }
    }

    if (f24) {
      semesterArray.push('Fall 2024');
    }
    if (s25) {
      semesterArray.push('Spring 2025');
    }

    // get courses as array
    const coursesArray = personName;

    let coursesMap: { [key: string]: string } = {};
    for (let i = 0; i < coursesArray.length; i++) {
      coursesMap[coursesArray[i]] = 'applied';
    }

    // extract the specific user data from the form data into a parsable object
    const applicationData = {
      firstname: formData.get('firstName') as string,
      lastname: formData.get('lastName') as string,
      email: formData.get('email') as string,
      ufid: 'NA',
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

    if (!applicationData.email.includes('ufl')) {
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
    } else if (applicationData.phonenumber === '') {
      toast.error('Please enter a valid phone number!');
      setLoading(false);
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
    } else if (applicationData.available_hours.length == 0) {
      toast.error('Please enter your available hours!');
      setLoading(false);
      return;
    } else if (applicationData.available_semesters.length == 0) {
      toast.error('Please enter your available semesters!');
      setLoading(false);
      return;
    } else if (coursesArray.length == 0) {
      toast.error('Please enter your courses!');
      setLoading(false);
      return;
    } else {
      const toastId = toast.loading('Processing application', {
        duration: 30000,
      });
      await firebase.firestore().collection('assignments').doc(userId).delete();
      // console.log(applicationData); // FOR DEBUGGING ONLY!

      // use fetch to send the application data to the server
      // this goes to a cloud function which creates a document based on
      // the data from the form, identified by the user's firebase auth uid
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
        await handleSendEmail();
        toast.dismiss(toastId);
        toast.success('Application submitted!');
        console.log('SUCCESS: Application data sent to server successfully');
        // now, update the role of the user to student_applied
        await UpdateRole(userId, 'student_applied');
        // then, refresh the page somehow to reflect the state changing
        // so the form goes away and the user can see the status of their application

        router.push('/');
      } else {
        toast.dismiss(toastId);
        toast.error('Application data failed to send to server!');
        console.log('ERROR: Application data failed to send to server');
      }
      setLoading(false);
    }
  };
  const [success, setSuccess] = React.useState(false);
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
    if (reason === 'clickaway') {
      return;
    }

    setSuccess(false);
  };

  const [personName, setPersonName] = React.useState<string[]>([]);

  const handleChange = (event: SelectChangeEvent<typeof personName>) => {
    const {
      target: { value },
    } = event;
    setPersonName(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };
  const [names, setNames] = useState([]);

  React.useEffect(() => {
    async function fetchData() {
      try {
        let data = [];
        await firebase
          .firestore()
          .collection('courses')
          .get()
          .then((snapshot) => snapshot.docs.map((doc) => data.push(doc.id)));

        setNames(data);
      } catch (err) {
        console.log(err);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <Toaster />
      <HeaderCard text="Application" />
      <Container className="container" component="main" maxWidth="md">
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
            marginTop: '-350px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Grid item xs={12} sm={6} sx={{ marginTop: 45 }}>
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

                <FormControl variant="filled" fullWidth>
                  <InputLabel
                    id="demo-multiple-checkbox-label"
                    variant="filled"
                  >
                    Course(s)*
                  </InputLabel>
                  <Select
                    variant="filled"
                    labelId="demo-multiple-checkbox-label"
                    id="course-prompt"
                    name="course-prompt"
                    multiple
                    value={personName}
                    onChange={handleChange}
                    input={<FilledInput label="Tag" />}
                    renderValue={(selected) => (
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                        }}
                      >
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                    required
                  >
                    {names.map((name) => (
                      <MenuItem key={name} value={name}>
                        <Checkbox checked={personName.indexOf(name) > -1} />
                        <ListItemText primary={name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  Please provide your most recently calculated cumulative UF
                  GPA.
                </Typography>
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
                  <br /> <br />
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
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
}
