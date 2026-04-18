'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-hot-toast';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { PrimaryButton, GhostButton } from '@/components/Buttons/PrimaryButton';
import handleSignIn from '../../firebase/auth/auth_signin_password';

type LoginValues = { email: string; password: string };
type ResetValues = { resetEmail: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cardSx = {
  width: { xs: '100%', sm: 480, md: 539 },
  maxWidth: '100%',
  bgcolor: '#fff',
  borderRadius: 5,
  boxShadow: '0px 4px 35px rgba(0,0,0,0.08)',
  p: { xs: 3, sm: 4.5 },
  display: 'flex',
  flexDirection: 'column',
  gap: 2.5,
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

export const LogInCard = ({
  className,
  setSignup,
}: {
  className?: string;
  setSignup: (val: boolean) => void;
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ mode: 'onBlur' });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    reset: resetResetForm,
    formState: { errors: resetErrors, isSubmitting: resetSubmitting },
  } = useForm<ResetValues>({ mode: 'onBlur' });

  const onSubmit = async ({ email, password }: LoginValues) => {
    const ok = await handleSignIn(email.trim(), password);
    if (!ok) {
      // handleSignIn already toasts on failure
      return;
    }
  };

  const onReset = async ({ resetEmail }: ResetValues) => {
    try {
      await sendPasswordResetEmail(getAuth(), resetEmail.trim());
      toast.success('Password reset email sent!');
      setResetOpen(false);
      resetResetForm();
    } catch (err: any) {
      toast.error(
        err?.code === 'auth/user-not-found'
          ? 'No account found for that email.'
          : 'Could not send reset email. Try again.'
      );
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
          Log In
        </Box>
        <Divider
          sx={{ mt: 1.5, borderColor: '#6b46c1', borderBottomWidth: 2 }}
        />
      </Box>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}
      >
        <TextField
          label="Email"
          placeholder="email@ufl.edu"
          type="email"
          fullWidth
          autoFocus
          autoComplete="email"
          error={!!errors.email}
          helperText={errors.email?.message ?? ' '}
          sx={inputSx}
          {...register('email', {
            required: 'Email is required.',
            pattern: {
              value: EMAIL_RE,
              message: 'Enter a valid email address.',
            },
          })}
        />

        <TextField
          label="Password"
          placeholder="Enter your password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          autoComplete="current-password"
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
            minLength: { value: 6, message: 'At least 6 characters.' },
          })}
        />

        <PrimaryButton
          type="submit"
          aria-label="Log in"
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
            'Log In'
          )}
        </PrimaryButton>

        <Box sx={{ textAlign: 'center', mt: 0.5 }}>
          <GhostButton
            type="button"
            w="auto"
            h="auto"
            onClick={() => setResetOpen(true)}
            sx={{ textDecoration: 'underline', fontSize: 14, p: 0.5 }}
          >
            Forgot Password?
          </GhostButton>
        </Box>

        <Box sx={{ textAlign: 'center', fontSize: 14, color: '#555' }}>
          Don&apos;t have an account?{' '}
          <GhostButton
            type="button"
            w="auto"
            h="auto"
            onClick={() => setSignup(true)}
            sx={{
              textDecoration: 'underline',
              fontSize: 14,
              p: 0.5,
              minWidth: 0,
            }}
          >
            Sign Up
          </GhostButton>
        </Box>
      </Box>

      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: { xs: 1, sm: 2 },
            maxWidth: 480,
          },
        }}
      >
        <DialogTitle
          sx={{ textAlign: 'center', fontSize: 28, fontWeight: 600, pb: 1 }}
        >
          Reset Password
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmitReset(onReset)} noValidate>
          <DialogContent>
            <DialogContentText
              sx={{ textAlign: 'center', fontSize: 15, color: '#333', mb: 3 }}
            >
              Enter the email associated with your account and we&apos;ll send
              you a link to reset your password.
            </DialogContentText>
            <TextField
              label="Email"
              type="email"
              fullWidth
              autoFocus
              error={!!resetErrors.resetEmail}
              helperText={resetErrors.resetEmail?.message ?? ' '}
              sx={inputSx}
              {...registerReset('resetEmail', {
                required: 'Email is required.',
                pattern: {
                  value: EMAIL_RE,
                  message: 'Enter a valid email address.',
                },
              })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
            <GhostButton
              type="button"
              onClick={() => setResetOpen(false)}
              w={120}
              h={44}
              radius={2.5}
              sx={{
                border: '2px solid #6739B7',
                fontWeight: 600,
              }}
            >
              Cancel
            </GhostButton>
            <PrimaryButton
              type="submit"
              disabled={resetSubmitting}
              w={120}
              h={44}
              radius={2.5}
              sx={{ fontWeight: 600 }}
            >
              {resetSubmitting ? (
                <CircularProgress size={20} sx={{ color: '#fff' }} />
              ) : (
                'Reset'
              )}
            </PrimaryButton>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
