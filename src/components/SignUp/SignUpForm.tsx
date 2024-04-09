'use client';
import * as React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import DepartmentSelect from '../FormUtil/DepartmentSelect';
import RoleSelect from '../FormUtil/RoleSelect';
import LinearProgress from '@mui/material/LinearProgress';
import handleSignUp from '../../firebase/auth/auth_signup_password';
import handleSignIn from '@/firebase/auth/auth_signin_password';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';


export default function SignUpForm() {
  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });
  function isStrongPassword(password: string): boolean {
    // Check if the password is at least 8 characters long
    if (password.length < 8) {
      toast.error('Password should contain at least 8 letters!');
      return false;
    }

    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const numberRegex = /[0-9]/;
    const specialCharacterRegex = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/;

    if (!uppercaseRegex.test(password)) {
      toast.error('Password should contain at least one uppercase letter!');
      return false;
    }
    if (!lowercaseRegex.test(password)) {
      toast.error('Password should contain at least one lowercase letter!')

      return false;
    }
    if (!numberRegex.test(password)) {
      toast.error('Password should contain at least one number!')

      return false;
    }
    if (!specialCharacterRegex.test(password)) {
      toast.error('Password should contain at least one special case character!')

      return false;
    }

    return true;
  }

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    // extract the form data from the current event
    const formData = new FormData(event.currentTarget);
    // extract the specific user data from the form data into a parsable object
    const userData = {
      firstname: formData.get('firstName') as string,
      lastname: formData.get('lastName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      department: formData.get('department-select') as string,
      role: formData.get('roles-radio-group') as string,
      ufid: formData.get('ufid') as string,
      uid: '',
    };
    console.log("Role " + userData.role);

    // add the following:
    if (userData.firstname === '') {
      toast.error('Invalid first name!');
    } else if (/[0-9]/.test(userData.firstname)) {
      toast.error('First name should only contain letters!');
    } else if (userData.lastname == '') {
      toast.error('Invalid last name!');
    } else if (!/^[0-9]+$/.test(userData.ufid) || userData.ufid.length < 6) {
      toast.error('UFID should only contain numbers with no spaces or dashes!');
    } else if (userData.role === null) {
      toast.error('Please select a role!');
    } else if (userData.department === '') {
      toast.error('Please select a department!')
    } else if (userData.password === '') {
      toast.error('Please enter a password!');
    } else if (!isStrongPassword(userData.password)) {
      console.log("invalid password");

    } else if (userData.ufid == '') {
      toast.error('Please enter your UFID!');
    } else {
      const uid_from_signup = await handleSignUp(
        userData.firstname + ' ' + userData.lastname,
        userData.email,
        userData.password,
      );
      userData.uid = uid_from_signup;
      console.log(userData.uid);

      if (userData.uid === '-1' || userData.uid === '') {
        toast.error('This UFID is Already in Use!');

        // error: user not created
        // display some kind of snackbar or toast saying UFID is already in use
      } else if (
        userData.uid === '-2' ||
        userData.uid === '-4' ||
        userData.uid == '-3'
      ) {
        toast.error('Please Enter a Valid Email Adress!');
      } else if (userData.uid == '-5') {
        toast.error('Email adress is already in use by another account!');
      } else {
        // use fetch to send the user data to the server
        // this goes to a cloud function which creates a document based on
        // the data from the form, identified by the user's firebase auth uid

        const response = await fetch(
          'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/processSignUpForm',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          }
        );

        if (response.ok) {
          setSuccess(true);
          console.log('SUCCESS: User data sent to server successfully');
          // then, sign in the user
          handleSignIn(userData.email, userData.password);
        } else {
          console.log('ERROR: User data failed to send to server');
          // display some kind of snackbar or toast saying data failed to send to server
        }
      }
    }

    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Snackbar open={success} autoHideDuration={3000}>
        <Alert severity="info" sx={{ width: '100%' }}>
          Signup successfull!
        </Alert>
      </Snackbar>
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
          <AccountCircleIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>

        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {loading ? <LinearProgress color="warning" /> : null}
          <br />
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
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
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
            <Grid item xs={12}>
              <RoleSelect />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>

          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link href="/" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}
