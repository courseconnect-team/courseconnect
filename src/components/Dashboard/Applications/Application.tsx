'use client';
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DepartmentSelect from '@/components/FormUtil/DepartmentSelect';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import DegreeSelect from '@/components/FormUtil/DegreeSelect';
import SemesterStatusSelect from '@/components/FormUtil/SemesterStatusSelect';
import NationalitySelect from '@/components/FormUtil/NationalitySelect';
import ProficiencySelect from '@/components/FormUtil/ProficiencySelect';
import PositionSelect from '@/components/FormUtil/PositionSelect';
import AvailabilityCheckbox from '@/components/FormUtil/AvailabilityCheckbox';
import SemesterCheckbox from '@/components/FormUtil/SemesterCheckbox';
import UpdateRole from '@/firebase/util/UpdateUserRole';
import { useAuth } from '@/firebase/auth/auth_context';

export default function Application() {
  // get the current user's uid
  const { user } = useAuth();
  const userId = user.uid;

  // get the current date in month/day/year format
  const current = new Date();
  const current_date = `${
    current.getMonth() + 1
  }-${current.getDate()}-${current.getFullYear()}`;

  // extract the nationality
  const [nationality, setNationality] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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

    // extract semester checkbox's values
    const semesterCheckbox_summerb_2023 =
      formData.get('semesterCheckbox_summerb_2023') === 'on';
    const semesterCheckbox_fall_2023 =
      formData.get('semesterCheckbox_fall_2023') === 'on';
    const semesterCheckbox_spring_2024 =
      formData.get('semesterCheckbox_spring_2024') === 'on';

    const courseListString = formData.get('course-prompt') as string;
    const courseList = courseListString
      .split(',')
      .map((course) => course.trim());

    // extract the specific user data from the form data into a parsable object
    const applicationData = {
      firstname: formData.get('firstName') as string,
      lastname: formData.get('lastName') as string,
      email: formData.get('email') as string,
      ufid: formData.get('ufid') as string,
      phonenumber: formData.get('phone-number') as string,
      department: formData.get('department-select') as string,
      degree: formData.get('degrees-radio-group') as string,
      semesterstatus: formData.get('semstatus-radio-group') as string,
      nationality: nationality as string,
      englishproficiency: formData.get('proficiency-select') as string,
      position: formData.get('positions-radio-group') as string,
      available_hours: {
        seven: availabilityCheckbox_seven,
        fourteen: availabilityCheckbox_fourteen,
        twenty: availabilityCheckbox_twenty,
      },
      available_semesters: {
        summerb_2023: semesterCheckbox_summerb_2023,
        fall_2023: semesterCheckbox_fall_2023,
        spring_2024: semesterCheckbox_spring_2024,
      },
      courses: courseList as string[],
      qualifications: formData.get('qualifications-prompt') as string,
      uid: userId,
      date: current_date,
      status: 'submitted',
    };

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
      console.log('SUCCESS: Application data sent to server successfully');
      // now, update the role of the user to student_applied
      await UpdateRole(userId, 'student_applied');
      // then, refresh the page somehow to reflect the state changing
      // so the form goes away and the user can see the status of their application
      location.reload();
    } else {
      console.log('ERROR: Application data failed to send to server');
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <EditNoteIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          TA/UPI/Grader Application
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit}>
          <Typography align="center" component="h2" variant="h6" sx={{ m: 1 }}>
            Personal Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="given-name"
                name="firstName"
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
                name="phone-number"
                label="Phone Number"
                type="tel"
                id="phone-number"
                autoComplete="phone-number"
                helperText="Enter your phone number. Example: 123-456-7890"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DepartmentSelect />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="ufid"
                label="UFID"
                name="ufid"
                autoComplete="ufid"
                helperText="No dashes or spaces."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SemesterStatusSelect />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DegreeSelect />
            </Grid>
          </Grid>
          <Typography align="center" component="h2" variant="h6" sx={{ m: 1 }}>
            Demographic Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography>
                Please select your nationality, based on country of origin.{' '}
                <br />
                Federal laws prohibit discrimination based on a person&apos;s
                national origin, race, color, religion, disability, sex, and
                familial status. This question is asked to confirm the
                demographic basis for the applicant&apos;s proficiency in
                English.
              </Typography>
              <NationalitySelect onNationalityChange={setNationality} />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                Please select your proficiency in English.
              </Typography>
              <ProficiencySelect />
            </Grid>
          </Grid>
          <Typography align="center" component="h2" variant="h6" sx={{ m: 1 }}>
            Position Information
          </Typography>
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
                Please select the semester(s) for which you are applying.
              </Typography>
              <SemesterCheckbox name="semesterCheckbox" />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                Please select one or more options describing the number of hours
                per week you will be available.
              </Typography>
              <AvailabilityCheckbox name="availabilityCheckbox" />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                Please list the course(s) for which you are applying, separated
                by commas.
              </Typography>
              <TextField
                required
                fullWidth
                id="course-prompt"
                name="course-prompt"
                label="Course(s)"
                multiline
                rows={1}
                variant="filled"
                helperText="Example: COP3502, COP3503, COP3504"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                Please describe your qualifications for the position and
                course(s) for which you are applying.
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
  );
}
