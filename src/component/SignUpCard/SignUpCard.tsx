'use client';
import React from 'react';
import { useState } from 'react';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Snackbar,
  TextField,
  Divider,
} from '@mui/material';
import handleSignUp from '../../firebase/auth/auth_signup_password';
import handleSignIn from '@/firebase/auth/auth_signin_password';

import styles from './style.module.css';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { toast } from 'react-hot-toast';
import { callFunction } from '@/firebase/functions/callFunction';
export const SignUpCard = ({
  className,
  setSignup,
}: {
  className: any;
  setSignup: (val: boolean) => void;
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [ufid, setUFID] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('ECE');
  const [roleLabel, setRoleLabel] = useState('Student');

  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  const handleNotificationEmail = async () => {
    if (role == 'unapproved') {
      try {
        await callFunction(
          'sendEmail',
          {
            type: 'unapprovedUser',
            data: {
              user: {
                name: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
                email: email,
              },
            },
          },
          { requireAuth: false }
        );
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }
  };

  function isStrongPassword(password: string): boolean {
    // Check if the password is at least 8 characters long
    if (password.length < 8) {
      toast.error('Password should contain at least 8 characters!');
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
      toast.error('Password should contain at least one lowercase letter!');

      return false;
    }
    if (!numberRegex.test(password)) {
      toast.error('Password should contain at least one number!');

      return false;
    }
    if (!specialCharacterRegex.test(password)) {
      toast.error(
        'Password should contain at least one special case character!'
      );

      return false;
    }

    return true;
  }

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const handleSubmit = async (event: any) => {
    setLoading(true);
    event.preventDefault();
    // extract the specific user data from the form data into a parsable object
    const userData = {
      firstname: firstName,
      lastname: lastName,
      email: email,
      password: password,
      confirmedpassword: confirmedPassword,
      department: department,
      role: role,
      ufid: ufid,
      uid: '',
    };

    // add the following:
    if (userData.firstname === '') {
      toast.error('Please enter a first name!');
    } else if (/[0-9]/.test(userData.firstname)) {
      toast.error('First name should only contain letters!');
    } else if (userData.lastname == '') {
      toast.error('Please enter a last name!');
    } else if (userData.role === null || userData.role === '') {
      toast.error('Please select a role!');
    } else if (userData.department === '') {
      toast.error('Please select a department!');
    } else if (userData.password === '') {
      toast.error('Please enter a password!');
    } else if (userData.confirmedpassword != userData.password) {
      toast.error('Passwords should match!');
    } else if (!isStrongPassword(userData.password)) {
      console.log('invalid password');
    } else {
      const uid_from_signup = await handleSignUp(
        userData.firstname + ' ' + userData.lastname,
        userData.email,
        userData.password
      );
      userData.uid = uid_from_signup;

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

        const userProfilePayload = {
          firstname: userData.firstname,
          lastname: userData.lastname,
          email: userData.email,
          department: userData.department,
          role: userData.role,
          ufid: userData.ufid,
          uid: userData.uid,
        };

        try {
          await callFunction('processSignUpForm', userProfilePayload, {
            requireAuth: false,
          });
          setSuccess(true);
          console.log('SUCCESS: User data sent to server successfully');
          // then, sign in the user
          handleSignIn(userData.email, userData.password);
        } catch (err) {
          console.error(err);
          console.log('ERROR: User data failed to send to server');
          // display some kind of snackbar or toast saying data failed to send to server
        }

        handleNotificationEmail();
      }
    }

    setLoading(false);
  };

  return (
    <div className={styles.box}>
      <Snackbar open={success} autoHideDuration={3000}>
        <Alert severity="info" sx={{ width: '100%' }}>
          Signup successfull!
        </Alert>
      </Snackbar>
      <div className={className}>
        <div className={styles.overlap}>
          <div className={styles.div}>Sign Up</div>
          <Divider
            sx={{
              position: 'absolute',
              top: '115px',
              left: '30px',
              width: '475px',
              borderBottomWidth: 2,
              borderColor: '#6b46c1',
            }}
          />
          <div className={styles.firstnameinput}>
            <div className={styles.textwrapper2}>First Name</div>
            <div className={styles.overlapgroupwrapper}>
              <div className={styles.overlapgroup}>
                <TextField
                  variant="outlined"
                  InputProps={{
                    disableUnderline: true,
                  }}
                  className={styles.textwrapper3}
                  placeholder="Albert"
                  required
                  fullWidth
                  size="small"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setFirstName(event.target.value);
                  }}
                  id="first-name"
                  name="first-name"
                  autoComplete="given-name"
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className={styles.roleinput}>
            <div className={styles.textwrapper4}>Role</div>
            <div className={styles.overlapgroup2}>
              <TextField
                sx={{
                  borderRadius: '30px',
                }}
                value={role}
                placeholder="Set Role"
                InputLabelProps={{ shrink: false }}
                label={roleLabel}
                size="small"
                select
                onChange={(event) => {
                  setRole(event.target.value);
                  setRoleLabel('');
                }}
                className={styles.textwrapper9}
              >
                <MenuItem value={'student_applying'}>Student</MenuItem>
                <MenuItem value={'unapproved'}>Faculty</MenuItem>
              </TextField>
            </div>
          </div>

          <div className={styles.departmentinput}>
            <div className={styles.departmentdropdown}>
              <div className={styles.textwrapper7}>Department</div>
              <div className={styles.overlapgroup2}>
                <TextField
                  sx={{
                    borderRadius: '30px',
                  }}
                  value={department}
                  placeholder="First Name"
                  InputLabelProps={{ shrink: false }}
                  label={label}
                  select
                  onChange={(event) => {
                    setDepartment(event.target.value);
                    setLabel('');
                  }}
                  size="small"
                  className={styles.textwrapper9}
                >
                  <MenuItem value={'ECE'}>ECE</MenuItem>
                  <MenuItem value={'CISE'}>CISE</MenuItem>
                  <MenuItem value={'ESSIE'}>ESSIE</MenuItem>
                  <MenuItem value={'MAE'}>MAE</MenuItem>
                  <MenuItem value={'MSE'}>MSE</MenuItem>
                  <MenuItem value={'ABE'}>ABE</MenuItem>
                  <MenuItem value={'CHE'}>CHE</MenuItem>
                  <MenuItem value={'ISE'}>ISE</MenuItem>
                  <MenuItem value={'EED'}>EED</MenuItem>
                  <MenuItem value={'BME'}>BME</MenuItem>
                </TextField>
              </div>
            </div>
          </div>
          <div className={styles.lastnameinput}>
            <div className={styles.textwrapper2}>Last Name</div>
            <div className={styles.overlapgroupwrapper}>
              <div className={styles.overlapgroup}>
                <TextField
                  variant="outlined"
                  InputProps={{
                    disableUnderline: true,
                  }}
                  className={styles.textwrapper3}
                  placeholder="Gator"
                  required
                  fullWidth
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setLastName(event.target.value);
                  }}
                  id="full-width"
                  name="first-name"
                  size="small"
                  autoComplete="given-name"
                  autoFocus
                />
              </div>
            </div>
          </div>

          <div className={styles.emailaddressinput}>
            <div className={styles.textwrapper11}>Enter email address</div>
            <div className={styles.divwrapper}>
              <div className={styles.overlapgroup3}>
                <TextField
                  variant="outlined"
                  InputProps={{
                    disableUnderline: true,
                  }}
                  className={styles.textwrapperlongbox}
                  placeholder="email@ufl.edu"
                  required
                  fullWidth
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(event.target.value);
                  }}
                  id="email"
                  name="email"
                  size="small"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className={styles.passwordinput}>
            <div className={styles.textwrapper13}>Enter password</div>
            <div className={styles.textwrapper14}>Confirm password</div>
            <div className={styles.divwrapper}>
              <div className={styles.overlapgroup3}>
                <TextField
                  variant="outlined"
                  InputProps={{
                    disableUnderline: true,
                  }}
                  className={styles.textwrapperlongbox}
                  placeholder="1234567890"
                  required
                  size="small"
                  fullWidth={true}
                  name="password"
                  type="password"
                  id="password"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setPassword(event.target.value);
                  }}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className={styles.confirmpassword}>
              <div className={styles.overlapgroup3}>
                <TextField
                  variant="outlined"
                  InputProps={{
                    disableUnderline: true,
                  }}
                  className={styles.textwrapperlongbox}
                  placeholder="1234567890"
                  required
                  size="small"
                  fullWidth={true}
                  name="password"
                  type="password"
                  id="password"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setConfirmedPassword(event.target.value);
                  }}
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>
          <div className={styles.facultytext}>
            *If you are going to create a <strong>Faculty</strong> account,
            please make sure to sign up using the same email that you use for
            Onbase/Course Registration.
          </div>
          <div className={styles.signintext}>
            <span className="text-gray-300">Already have an account? </span>
            <br></br>
            <button
              className="cursor-pointer underline hover:no-underline"
              onClick={() => setSignup(false)}
            >
              {'Log In'}
            </button>
          </div>
          <div className={styles.signinbutton}>
            <br />
            <button
              onClick={(e) => handleSubmit(e)}
              className={styles.overlap2}
            >
              <div className={styles.textwrapper16}>Sign up</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
