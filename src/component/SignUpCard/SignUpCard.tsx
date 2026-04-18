'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { PrimaryButton, GhostButton } from '@/components/Buttons/PrimaryButton';
import handleSignUp from '../../firebase/auth/auth_signup_password';
import handleSignIn from '@/firebase/auth/auth_signin_password';
import { callFunction } from '@/firebase/functions/callFunction';
import firebase from '@/firebase/firebase_config';

type SignUpValues = {
  firstName: string;
  lastName: string;
  role: '' | 'student_applying' | 'unapproved';
  department: string;
  email: string;
  ufid: string;
  password: string;
  confirmPassword: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[A-Za-z][A-Za-z\s'-]*$/;

const DEPARTMENTS = ['ECE', 'CS', 'MSE', 'ISE', 'MAE', 'BME', 'NRE'] as const;

const cardSx = {
  width: { xs: '100%', sm: 480, md: 539 },
  maxWidth: '100%',
  bgcolor: '#fff',
  borderRadius: 5,
  boxShadow: '0px 4px 35px rgba(0,0,0,0.08)',
  p: { xs: 3, sm: 4.5 },
  display: 'flex',
  flexDirection: 'column',
  gap: 2.25,
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: '#fafafa',
    '& fieldset': { borderColor: '#e3e3e3' },
    '&:hover fieldset': { borderColor: '#bbb' },
    '&.Mui-focused fieldset': { borderColor: '#6739B7', borderWidth: 2 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#6739B7' },
};

function scorePassword(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(pw)) score++;
  const label =
    score <= 2
      ? 'Weak'
      : score === 3
      ? 'Fair'
      : score === 4
      ? 'Good'
      : 'Strong';
  return { score, label };
}

export const SignUpCard = ({
  className,
  setSignup,
}: {
  className?: string;
  setSignup?: (val: boolean) => void;
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      role: '',
      department: '',
      email: '',
      ufid: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');
  const { score, label: strengthLabel } = scorePassword(password);
  const strengthColor =
    score <= 2
      ? '#d32f2f'
      : score === 3
      ? '#ed6c02'
      : score >= 4
      ? '#2e7d32'
      : '#bbb';

  const onSubmit = async (values: SignUpValues) => {
    try {
      const safeFirstName = values.firstName.trim();
      const safeLastName = values.lastName.trim();
      const safeEmail = values.email.trim();
      const safeUFID = values.ufid.trim() || '00000000';
      const fullName = `${safeFirstName} ${safeLastName}`.trim();

      const uidFromSignup = await handleSignUp(
        fullName,
        safeEmail,
        values.password
      );

      if (uidFromSignup === '-1' || uidFromSignup === '') {
        toast.error('This UFID is already in use!');
        return;
      }
      if (['-2', '-3', '-4'].includes(uidFromSignup)) {
        toast.error('Please enter a valid email address!');
        return;
      }
      if (uidFromSignup === '-5') {
        toast.error('Email address is already in use by another account!');
        return;
      }

      await firebase.firestore().collection('users').doc(uidFromSignup).set(
        {
          firstname: safeFirstName,
          lastname: safeLastName,
          email: safeEmail,
          department: values.department,
          role: values.role,
          ufid: safeUFID,
          uid: uidFromSignup,
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
          updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (values.role === 'unapproved') {
        try {
          await callFunction(
            'sendEmail',
            {
              type: 'unapprovedUser',
              data: {
                user: { name: fullName, email: safeEmail },
              },
            },
            { requireAuth: false }
          );
        } catch (err) {
          console.error('Error sending unapproved user email:', err);
        }
      }

      toast.success('Signup successful!');
      await handleSignIn(safeEmail, values.password);
    } catch (err: any) {
      console.error('user doc write failed:', err);
      toast.error(err?.message || 'Failed to create user profile');
    }
  };

  return (
    <Box className={className} sx={cardSx}>
      <Box>
        <Box
          component="h1"
          sx={{
            m: 0,
            fontSize: { xs: 40, sm: 48 },
            fontWeight: 600,
            color: '#111',
            letterSpacing: '-0.02em',
          }}
        >
          Sign Up
        </Box>
        <Divider
          sx={{ mt: 1.5, borderColor: '#6b46c1', borderBottomWidth: 2 }}
        />
      </Box>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          <TextField
            label="First Name"
            placeholder="Albert"
            fullWidth
            autoFocus
            autoComplete="given-name"
            error={!!errors.firstName}
            helperText={errors.firstName?.message ?? ' '}
            sx={inputSx}
            {...register('firstName', {
              required: 'First name is required.',
              pattern: {
                value: NAME_RE,
                message: 'Letters, spaces, hyphens only.',
              },
            })}
          />
          <TextField
            label="Last Name"
            placeholder="Einstein"
            fullWidth
            autoComplete="family-name"
            error={!!errors.lastName}
            helperText={errors.lastName?.message ?? ' '}
            sx={inputSx}
            {...register('lastName', {
              required: 'Last name is required.',
              pattern: {
                value: NAME_RE,
                message: 'Letters, spaces, hyphens only.',
              },
            })}
          />
        </Box>

        <TextField
          label="Email"
          placeholder="email@ufl.edu"
          type="email"
          fullWidth
          autoComplete="email"
          error={!!errors.email}
          helperText={errors.email?.message ?? ' '}
          sx={inputSx}
          {...register('email', {
            required: 'Email is required.',
            pattern: { value: EMAIL_RE, message: 'Enter a valid email.' },
            validate: (v) =>
              v.toLowerCase().endsWith('ufl.edu') || 'Must be a ufl.edu email.',
          })}
        />

        <TextField
          label="UFID"
          placeholder="12345678"
          fullWidth
          inputMode="numeric"
          error={!!errors.ufid}
          helperText={errors.ufid?.message ?? ' '}
          sx={inputSx}
          {...register('ufid', {
            required: 'UFID is required.',
            pattern: { value: /^\d{8}$/, message: 'UFID must be 8 digits.' },
          })}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          <TextField
            label="Department"
            select
            fullWidth
            defaultValue=""
            error={!!errors.department}
            helperText={errors.department?.message ?? ' '}
            sx={inputSx}
            {...register('department', {
              required: 'Please select a department.',
            })}
          >
            {DEPARTMENTS.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Role"
            select
            fullWidth
            defaultValue=""
            error={!!errors.role}
            helperText={errors.role?.message ?? ' '}
            sx={inputSx}
            {...register('role', { required: 'Please select a role.' })}
          >
            <MenuItem value="student_applying">Student</MenuItem>
            <MenuItem value="unapproved">Faculty</MenuItem>
          </TextField>
        </Box>

        <TextField
          label="Password"
          placeholder="At least 8 characters"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          autoComplete="new-password"
          error={!!errors.password}
          helperText={errors.password?.message ?? ' '}
          sx={inputSx}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          {...register('password', {
            required: 'Password is required.',
            minLength: { value: 8, message: 'At least 8 characters.' },
            validate: {
              upper: (v) => /[A-Z]/.test(v) || 'Include an uppercase letter.',
              lower: (v) => /[a-z]/.test(v) || 'Include a lowercase letter.',
              number: (v) => /[0-9]/.test(v) || 'Include a number.',
              special: (v) =>
                /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(v) ||
                'Include a special character.',
            },
          })}
        />

        {password && (
          <Box sx={{ mt: -1 }}>
            <LinearProgress
              variant="determinate"
              value={(score / 5) * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#eee',
                '& .MuiLinearProgress-bar': { bgcolor: strengthColor },
              }}
            />
            <Box
              sx={{
                fontSize: 12,
                color: strengthColor,
                mt: 0.5,
                fontWeight: 500,
              }}
            >
              Strength: {strengthLabel}
            </Box>
          </Box>
        )}

        <TextField
          label="Confirm Password"
          placeholder="Re-enter password"
          type={showConfirm ? 'text' : 'password'}
          fullWidth
          autoComplete="new-password"
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message ?? ' '}
          sx={inputSx}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirm((v) => !v)}
                  edge="end"
                  size="small"
                >
                  {showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          {...register('confirmPassword', {
            required: 'Please confirm your password.',
            validate: (v) => v === password || 'Passwords do not match.',
          })}
        />

        <Box
          sx={{
            fontSize: 12,
            color: '#4D4D4D',
            fontWeight: 300,
            lineHeight: 1.5,
          }}
        >
          *If you are creating a <strong>Faculty</strong> account, please sign
          up using the same email you use for Onbase/Course Registration.
        </Box>

        <PrimaryButton
          type="submit"
          disabled={isSubmitting}
          w="100%"
          h={50}
          radius={2.5}
          sx={{
            fontSize: 16,
            fontWeight: 600,
            mt: 0.5,
            boxShadow: '0px 4px 19px rgba(119,147,65,0.3)',
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={22} sx={{ color: '#fff' }} />
          ) : (
            'Sign Up'
          )}
        </PrimaryButton>

        <Box sx={{ textAlign: 'center', fontSize: 14, color: '#555' }}>
          Already have an account?{' '}
          <GhostButton
            type="button"
            w="auto"
            h="auto"
            onClick={() => setSignup?.(false)}
            sx={{
              textDecoration: 'underline',
              fontSize: 14,
              p: 0.5,
              minWidth: 0,
            }}
          >
            Log In
          </GhostButton>
        </Box>
      </Box>
    </Box>
  );
};
