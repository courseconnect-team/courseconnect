'use client';
import React, { useState } from 'react';
import { MenuItem, Snackbar, TextField, Divider } from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { toast } from 'react-hot-toast';

import handleSignUp from '../../firebase/auth/auth_signup_password';
import handleSignIn from '@/firebase/auth/auth_signin_password';
import { callFunction } from '@/firebase/functions/callFunction';
import firebase from '@/firebase/firebase_config';

import styles from './style.module.css';

export const SignUpCard = ({
  className,
  setSignup,
}: {
  className: any;
  setSignup?: (val: boolean) => void;
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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  const handleNotificationEmail = async (
    safeFirstName: string,
    safeLastName: string,
    safeEmail: string
  ) => {
    if (role === 'unapproved') {
      try {
        await callFunction(
          'sendEmail',
          {
            type: 'unapprovedUser',
            data: {
              user: {
                name: `${safeFirstName} ${safeLastName}`.trim(),
                email: safeEmail,
              },
            },
          },
          { requireAuth: false }
        );
      } catch (error) {
        console.error('Error sending unapproved user email:', error);
      }
    }
  };

  function isStrongPassword(password: string): boolean {
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
      toast.error('Password should contain at least one special character!');
      return false;
    }

    return true;
  }

  const handleSubmit = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    setLoading(true);

    try {
      const safeFirstName = firstName.trim();
      const safeLastName = lastName.trim();
      const safeEmail = email.trim();
      const safeDepartment = department.trim();
      const safeRole = role.trim();
      const safeUFID = ufid.trim() || '00000000';

      if (safeFirstName === '') {
        toast.error('Please enter a first name!');
        return;
      }
      if (/[0-9]/.test(safeFirstName)) {
        toast.error('First name should only contain letters!');
        return;
      }
      if (safeLastName === '') {
        toast.error('Please enter a last name!');
        return;
      }
      if (safeRole === '') {
        toast.error('Please select a role!');
        return;
      }
      if (safeDepartment === '') {
        toast.error('Please select a department!');
        return;
      }
      if (safeEmail === '') {
        toast.error('Please enter an email!');
        return;
      }
      if (password === '') {
        toast.error('Please enter a password!');
        return;
      }
      if (confirmedPassword !== password) {
        toast.error('Passwords should match!');
        return;
      }
      if (!isStrongPassword(password)) {
        return;
      }

      const fullName = `${safeFirstName} ${safeLastName}`.trim();

      const uidFromSignup = await handleSignUp(fullName, safeEmail, password);

      console.log('signup returned uid/code:', uidFromSignup);

      if (uidFromSignup === '-1' || uidFromSignup === '') {
        toast.error('This UFID is already in use!');
        return;
      }
      if (
        uidFromSignup === '-2' ||
        uidFromSignup === '-3' ||
        uidFromSignup === '-4'
      ) {
        toast.error('Please enter a valid email address!');
        return;
      }
      if (uidFromSignup === '-5') {
        toast.error('Email address is already in use by another account!');
        return;
      }

      const userProfilePayload = {
        firstname: safeFirstName,
        lastname: safeLastName,
        email: safeEmail,
        department: safeDepartment,
        role: safeRole,
        ufid: safeUFID,
        uid: uidFromSignup,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      };

      console.log('about to write users doc');
      console.log('payload:', userProfilePayload);

      await firebase
        .firestore()
        .collection('users')
        .doc(uidFromSignup)
        .set(userProfilePayload, { merge: true });

      setSuccess(true);
      console.log('SUCCESS: User data written to users collection');

      await handleNotificationEmail(safeFirstName, safeLastName, safeEmail);
      await handleSignIn(safeEmail, password);
    } catch (err: any) {
      console.error('user doc write failed:', err);
      toast.error(err?.message || 'Failed to create user profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.box}>
      <Snackbar open={success} autoHideDuration={3000}>
        <Alert severity="info" sx={{ width: '100%' }}>
          Signup successful!
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
                  InputProps={{ disableUnderline: true }}
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
                sx={{ borderRadius: '30px' }}
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

          <div className={styles.lastnameinput}>
            <div className={styles.textwrapper10}>Last Name</div>
            <div className={styles.overlapgroupwrapper}>
              <div className={styles.overlapgroup}>
                <TextField
                  variant="outlined"
                  InputProps={{ disableUnderline: true }}
                  className={styles.textwrapper3}
                  placeholder="Einstein"
                  required
                  fullWidth
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setLastName(event.target.value);
                  }}
                  id="last-name"
                  name="last-name"
                  size="small"
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          <div className={styles.departmentinput}>
            <div className={styles.textwrapper4}>Department</div>
            <div className={styles.overlapgroup2}>
              <TextField
                sx={{ borderRadius: '30px' }}
                value={department}
                placeholder="Set Department"
                InputLabelProps={{ shrink: false }}
                label={label}
                size="small"
                select
                onChange={(event) => {
                  setDepartment(event.target.value);
                  setLabel('');
                }}
                className={styles.textwrapper9}
              >
                <MenuItem value={'ECE'}>ECE</MenuItem>
                <MenuItem value={'CS'}>CS</MenuItem>
                <MenuItem value={'MSE'}>MSE</MenuItem>
                <MenuItem value={'ISE'}>ISE</MenuItem>
                <MenuItem value={'MAE'}>MAE</MenuItem>
                <MenuItem value={'BME'}>BME</MenuItem>
                <MenuItem value={'NRE'}>NRE</MenuItem>
              </TextField>
            </div>
          </div>

          <div className={styles.ufidinput}>
            <div className={styles.textwrapper11}>UFID</div>
            <div className={styles.divwrapper}>
              <div className={styles.overlapgroup3}>
                <TextField
                  variant="outlined"
                  InputProps={{ disableUnderline: true }}
                  className={styles.textwrapperlongbox}
                  placeholder="12345678"
                  required
                  fullWidth
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setUFID(event.target.value);
                  }}
                  id="ufid"
                  name="ufid"
                  size="small"
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
                  InputProps={{ disableUnderline: true }}
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
                  InputProps={{ disableUnderline: true }}
                  className={styles.textwrapperlongbox}
                  placeholder="1234567890"
                  required
                  size="small"
                  fullWidth
                  name="password"
                  type="password"
                  id="password"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setPassword(event.target.value);
                  }}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className={styles.confirmpassword}>
              <div className={styles.overlapgroup3}>
                <TextField
                  variant="outlined"
                  InputProps={{ disableUnderline: true }}
                  className={styles.textwrapperlongbox}
                  placeholder="1234567890"
                  required
                  size="small"
                  fullWidth
                  name="confirm-password"
                  type="password"
                  id="confirm-password"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setConfirmedPassword(event.target.value);
                  }}
                  autoComplete="new-password"
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
            <br />
            <button
              type="button"
              className="cursor-pointer underline hover:no-underline"
              onClick={() => setSignup?.(false)}
            >
              Log In
            </button>
          </div>

          <div className={styles.signinbutton}>
            <br />
            <button
              type="button"
              onClick={handleSubmit}
              className={styles.overlap2}
              disabled={loading}
            >
              <div className={styles.textwrapper16}>
                {loading ? 'Signing up...' : 'Sign up'}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
