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
import SemesterSelect from '@/components/FormUtil/SemesterSelect';
import AvailabilitySelect from '@/components/FormUtil/AvailabilitySelect';
import PositionSelect from '@/components/FormUtil/PositionSelect';

export default function SignUpForm() {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // extract the form data from the current event
    const formData = new FormData(event.currentTarget);
    // extract the specific user data from the form data into a parsable object

    // const userData = {
    //   firstname: formData.get('firstName') as string,
    //   lastname: formData.get('lastName') as string,
    //   email: formData.get('email') as string,
    //   password: formData.get('password') as string,
    //   department: formData.get('department-select') as string,
    //   role: formData.get('roles-radio-group') as string,
    //   ufid: formData.get('ufid') as string,
    //   uid: '',
    // };
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
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Typography align="center" noWrap>
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
                type="phone-number"
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
          <Typography align="center" noWrap>
            Demographic Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <NationalitySelect />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ProficiencySelect />
            </Grid>
          </Grid>
          <Typography align="center" noWrap>
            Position Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <PositionSelect />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SemesterSelect />
            </Grid>
            <Grid item xs={12} sm={6}>
              <AvailabilitySelect />
            </Grid>
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
