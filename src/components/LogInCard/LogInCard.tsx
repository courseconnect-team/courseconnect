"use client";

import React from "react";

import handleSignIn from '../../firebase/auth/auth_signin_password';
import { useState } from 'react';
import "./style.css";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { TextField } from "@mui/material";


export const LogInCard = ({ className }: { className: any }) => {
  var res;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });
  const handleSubmit = async (event: any) => {
    setLoading(true);
    event.preventDefault();
    res = await handleSignIn(email, password);
    console.log(res);
    // Loading bar toggle
    if (!res) {
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };
  return (
    <div className={`log-in-card ${className}`}>
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

              <TextField variant="standard"
                InputProps={{
                  disableUnderline: true,
                }} className="text-wrapper-3" placeholder="Email"
                margin="normal"
                required
                fullWidth
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setEmail(event.target.value);
                }}
                id="email"
                name="email"
                autoComplete="email"
                autoFocus />

            </div>
          </div>
        </div>
        <div className="password-input">
          <div className="text-wrapper-2">Enter password</div>
          <div className="overlap-group-wrapper">
            <div className="overlap-group">
              <TextField variant="standard"
                InputProps={{
                  disableUnderline: true,
                }} className="text-wrapper-3" placeholder="Password"
                margin="normal"
                required
                fullWidth
                name="password"
                type="password"
                id="password"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setPassword(event.target.value);
                }}
                autoComplete="current-password" />


            </div>
          </div>
        </div>
        <div className="text-wrapper-4">Forgot Password</div>
        <div className="sign-in-button">
          <button onClick={(e) => handleSubmit(e)} className="overlap">
            <div className="text-wrapper-5">
              Sign In
            </div>
          </button>
        </div>
      </form>
    </div>
  );
};

