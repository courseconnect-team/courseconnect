"use client";
import React from "react";
import { useState } from "react";
import "./style.css";
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from "@mui/material";

export const SignUpCard = ({ className }: { className: any }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [ufid, setUFID] = useState(-1);
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [email, setEmail] = useState("");
  return (
    <div className="box">
      <div className="log-in-card">
        <div className="overlap">
          <div className="welcome-to-course">
            <span className="text-wrapper">Welcome to </span>
            <span className="span">Course Connect</span>
          </div>
          <div className="div">Sign up</div>
          <div className="firstname-input">
            <div className="text-wrapper-2">Name</div>
            <div className="overlap-group-wrapper">
              <div className="overlap-group">
                <TextField variant="standard"
                  InputProps={{
                    disableUnderline: true,
                  }} className="text-wrapper-3" placeholder="First Name"
                  margin="none"
                  required
                  fullWidth
                  size="small"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setFirstName(event.target.value);
                  }}
                  id="first-name"
                  name="first-name"
                  autoComplete="given-name"
                  autoFocus />


              </div>
            </div>
          </div>
          <div className="role-input">
            <div className="text-wrapper-4">Role</div>
            <FormControl>
              <br />
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
              >
                <FormControlLabel value="female" control={<Radio />} label="Student" />
                <FormControlLabel value="male" control={<Radio />} label="Staff" />
              </RadioGroup>
            </FormControl>
          </div>
          <div className="department-input">
            <div className="department-dropdown">
              <div className="text-wrapper-7">Department*</div>
              <div className="overlap-group-2">
                <div className="text-wrapper-8">Department</div>
                <img
                  className="arrow-drop-down"
                  alt="Arrow drop down"
                  src="https://c.animaapp.com/znqU6NK3/img/arrow-drop-down@2x.png"
                />
              </div>
            </div>
          </div>
          <div className="lastname-input">
            <div className="text-wrapper-2">Last Name</div>
            <div className="overlap-group-wrapper">
              <div className="overlap-group">
                <TextField variant="standard"
                  InputProps={{
                    disableUnderline: true,
                  }} className="text-wrapper-3" placeholder="Last Name"
                  margin="none"
                  required
                  fullWidth
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setLastName(event.target.value);
                  }}
                  id="full-width"
                  name="first-name"
                  autoComplete="given-name"
                  autoFocus />
              </div>
            </div>
          </div>
          <div className="UFID-input">
            <div className="text-wrapper-9">UFID*</div>
            <div className="overlap-group-wrapper">
              <div className="overlap-group">
                <TextField variant="standard"
                  InputProps={{
                    disableUnderline: true,
                  }} className="text-wrapper-10" placeholder="UFID"
                  margin="none"
                  required
                  fullWidth
                  type="number"
                  size="small"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setFirstName(event.target.value);
                  }}
                  id="ufid"
                  name="ufid"
                  autoFocus />
              </div>
            </div>
          </div>
          <div className="email-address-input">
            <div className="text-wrapper-11">Enter email address</div>
            <div className="div-wrapper">
              <div className="overlap-group-3">
                <TextField variant="standard"
                  InputProps={{
                    disableUnderline: true,
                  }} className="text-wrapper-3" placeholder="Email"
                  margin="none"
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
            <div className="text-wrapper-13">Enter password</div>
            <div className="text-wrapper-14">Confirm password</div>
            <div className="div-wrapper">
              <div className="overlap-group-3">
                <TextField variant="standard"
                  InputProps={{
                    disableUnderline: true,
                  }} className="text-wrapper-15" placeholder="Password"
                  margin="none"
                  required
                  size="small"
                  fullWidth={true}
                  name="password"
                  type="password"
                  id="password"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setPassword(event.target.value);
                  }}
                  autoComplete="current-password" />
              </div>
            </div>
            <div className="confirmpassword">
              <div className="overlap-group-3">
                <TextField variant="standard"
                  InputProps={{
                    disableUnderline: true,
                  }} className="text-wrapper-15" placeholder="Confirm"
                  margin="none"
                  required
                  size="small"
                  fullWidth={true}
                  name="password"
                  type="password"
                  id="password"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setConfirmedPassword(event.target.value);
                  }}
                  autoComplete="current-password" />
              </div>
            </div>
          </div>
          <button className="sign-in-button">
            <br />
            <div className="overlap-2">
              <div className="text-wrapper-16">Sign up</div>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

