'use client';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

import React from 'react';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import handleSignIn from '../../firebase/auth/auth_signin_password';
import { useState } from 'react';
import './style.css';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { TextField } from '@mui/material';

import FormControl from '@mui/material/FormControl';
import { toast } from 'react-hot-toast';

import 'firebase/firestore';
export const LogInCard = ({ className }: { className: any }) => {
  var res;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [password, setPassword] = useState('');
  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setOpen(false);
  };

  const handleForgotPassword = (e: any) => {
    //handleSignOut();
    e.preventDefault();
    const auth = getAuth();
    sendPasswordResetEmail(auth, emailVal)
      .then(() => {
        // Password reset email sent!
        // ..
        toast.success('Password reset email sent!');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
        console.log(error);
      });
    setOpen(false);
  };
  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });
  const handleSubmit = async (event: any) => {
    setLoading(true);
    event.preventDefault();
    res = await handleSignIn(email, password);
    // Loading bar toggle
    if (!res) {
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };
  return (
    <div className={`log-in-card ${className}`}>
      <Dialog
        style={{
          borderImage:
            'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
          boxShadow: '0px 2px 20px 4px #00000040',
          borderRadius: '20px',
          border: '2px solid',
        }}
        PaperProps={{
          style: { borderRadius: 20 },
        }}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle
          style={{
            fontFamily: 'SF Pro Display-Medium, Helvetica',
            textAlign: 'center',
            fontSize: '40px',
            fontWeight: '540',
          }}
        >
          Reset Password
        </DialogTitle>
        <form onSubmit={(e) => handleForgotPassword(e)}>
          <DialogContent>
            <DialogContentText
              style={{
                marginTop: '35px',
                fontFamily: 'SF Pro Display-Medium, Helvetica',
                textAlign: 'center',
                fontSize: '20px',
                color: 'black',
              }}
            >
              Please enter the email associated with your account. This allows
              us to send you a link where you can reset the account password.
            </DialogContentText>
            <br />
            <br />

            <FormControl required>
              <TextField
                style={{ left: '160px' }}
                name="email"
                variant="filled"
                onChange={(val) => setEmailVal(val.target.value)}
                required
                fullWidth
                id="email"
                label="Email"
                autoFocus
              />
            </FormControl>
          </DialogContent>
          <DialogActions
            style={{
              marginTop: '30px',
              marginBottom: '42px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '93px',
            }}
          >
            <Button
              variant="outlined"
              style={{
                fontSize: '17px',
                marginLeft: '110px',
                borderRadius: '10px',
                height: '43px',
                width: '120px',
                textTransform: 'none',
                fontFamily: 'SF Pro Display-Bold , Helvetica',
                borderColor: '#5736ac',
                color: '#5736ac',
                borderWidth: '3px',
              }}
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              style={{
                fontSize: '17px',
                marginRight: '110px',
                borderRadius: '10px',
                height: '43px',
                width: '120px',
                textTransform: 'none',
                fontFamily: 'SF Pro Display-Bold , Helvetica',
                backgroundColor: '#5736ac',
                color: '#ffffff',
              }}
              type="submit"
            >
              Reset
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <form>
        <div className="welcome-to-course">
          <span className="text-wrapper">Welcome to </span>
          <span className="span">Course Connect</span>
        </div>
        <div className="div">Sign in</div>
        <div className="email-address-input">
          <div className="text-wrapper-2">Enter email address</div>
          <div className="overlap-group-wrapper">
            <div className="overlap-group">
              <TextField
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                }}
                className="text-wrapper-3"
                placeholder="Email"
                margin="normal"
                required
                fullWidth
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setEmail(event.target.value);
                }}
                id="email"
                name="email"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>
        </div>
        <div className="password-input">
          <div className="text-wrapper-2">Enter password</div>
          <div className="overlap-group-wrapper">
            <div className="overlap-group">
              <TextField
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                }}
                className="text-wrapper-3"
                placeholder="Password"
                margin="normal"
                required
                fullWidth
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
        </div>
        <div className="text-wrapper-4" onClick={(e) => setOpen(true)}>
          Forgot Password
        </div>
        <div className="sign-in-button">
          <button onClick={(e) => handleSubmit(e)} className="overlap">
            <div className="text-wrapper-5">Sign In</div>
          </button>
        </div>
      </form>
    </div>
  );
};
