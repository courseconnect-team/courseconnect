'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/firebase/auth/auth_context';
import { Button, Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import './style.css';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import DeleteUserButton from './DeleteUserButton';
import { updateProfile } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { QrCode2 } from '@mui/icons-material';
import { set } from 'react-hook-form';

interface ProfileProps {
  userRole: string;
}

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: '8px',
  height: '40px',
  width: '80px',
  textTransform: 'none',
  fontFamily: 'SF Pro Display-Bold , Helvetica',
  backgroundColor: '#5736ac',
  color: '#ffffff',
};

const secondaryButtonStyle: React.CSSProperties = {
  borderRadius: '8px',
  height: '40px',
  width: '80px',
  borderWidth: '2px',
  textTransform: 'none',
  fontFamily: 'SF Pro Display-Bold , Helvetica',
  borderColor: '#808080',
  color: '#808080',
};

const textFieldStyles = (isEditable: boolean) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: isEditable ? "black" : '#cecece',
    },
    '&:hover fieldset': {
      borderColor: isEditable ? "black" : '#cecece',
    },
    '&.Mui-focused fieldset': {
      borderColor: isEditable ? undefined : '#cecece',
      borderWidth: isEditable ? undefined : '1px',
    },
  },
  '& .MuiInputBase-input': {
    cursor: isEditable ? 'text' : 'default',
  },
  '& .MuiInputLabel-outlined': {
    color: isEditable ? undefined : '#888',
  },
  '& .MuiInputLabel-outlined.Mui-focused': {
    color: isEditable ? undefined : '#888',
  },
});

export default function Profile(props: ProfileProps) {
  const { user } = useAuth();
  const uid = user.uid as string;
  const db = getFirestore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gpa, setGpa] = useState('');
  const [department, setDepartment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [graduationDate, setGraduationDate] = useState('');
  const [degree, setDegree] = useState('');

  const [updatedFirst, setUpdatedFirst] = useState('');
  const [updatedLast, setUpdatedLast] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');
  const [updatedGpa, setUpdatedGpa] = useState('');
  const [updatedDepartment, setUpdatedDepartment] = useState('');
  const [updatedPhoneNumber, setUpdatedPhoneNumber] = useState('');
  const [updatedGraduationDate, setUpdatedGraduationDate] = useState('');
  const [updatedDegree, setUpdatedDegree] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const usersCollectionRef = collection(db, 'users_test');
        const q = query(usersCollectionRef, where('userId', '==', uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          setFirstName(data.firstname || '');
          setLastName(data.lastname || '');
          setEmail(data.email || '');
          setGpa(data.gpa || '');
          setDepartment(data.department || '');
          setPhoneNumber(data.phonenumber || '');
          setGraduationDate(data.graduationdate || '');
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [db, uid]);

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (firstName.trim() !== '' && lastName.trim() !== '') {
      try {
        const usersCollectionRef = collection(db, 'users_test');
        const q = query(usersCollectionRef, where('userId', '==', uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docRef = doc(db, 'users_test', querySnapshot.docs[0].id);
          const updatedData: any = {};

          if (updatedFirst.trim() !== '') updatedData.firstname = updatedFirst;
          if (updatedLast.trim() !== '') updatedData.lastname = updatedLast;
          if (updatedEmail.trim() !== '') updatedData.email = updatedEmail;
          if (updatedGpa.trim() !== '') updatedData.gpa = updatedGpa;
          if (updatedDepartment.trim() !== '')
            updatedData.department = updatedDepartment;
          if (updatedPhoneNumber.trim() !== '')
            updatedData.phonenumber = updatedPhoneNumber;
          if (updatedGraduationDate.trim() !== '')
            updatedData.graduationdate = updatedGraduationDate;
          if (updatedDegree.trim() !== '') updatedData.degree = updatedDegree;

          await updateDoc(docRef, updatedData);
          console.log('Profile updated successfully');
        } else {
          console.log('No such document!');
        }
        setIsEditing(false);
        window.location.reload();
        alert('Profile updated successfully');
      } catch (error) {
        console.error('Error updating profile: ', error);
        alert('Failed to update profile');
      }
    } else {
      alert('First name and last name cannot be empty.');
    }
  };

  const handleCancel = () => {
    setUpdatedFirst('');
    setUpdatedLast('');
    setUpdatedEmail('');
    setUpdatedGpa('');
    setUpdatedDepartment('');
    setUpdatedPhoneNumber('');
    setUpdatedGraduationDate('');
    setUpdatedDegree('');
    setIsEditing(false);
  };

  return (
    <>
      <HeaderCard text="Profile" />

      <div className="layout">
        <div className="left-section">
          <div className="full-name-and-bio">
            <div className="profile-image">
              {firstName[0]?.toUpperCase() + lastName[0]?.toUpperCase()}
            </div>
            <div className="name">{firstName + ' ' + lastName}</div>
            <div className="email-address">{email}</div>
            <DeleteUserButton open={open} setOpen={setOpen} />
          </div>
        </div>

        <div className="right-section">
          <form className="profile-container" onSubmit={handleSave}>
            <div className="row">
              <div className="title">Personal Information</div>
              <div className="button-container">
                {!isEditing ? (
                  <Button
                    variant="contained"
                    style={primaryButtonStyle}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      style={secondaryButtonStyle}
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      style={primaryButtonStyle}
                      onClick={handleSave}
                    >
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="firstname"
                  label="First Name"
                  variant="outlined"
                  value={updatedFirst}
                  placeholder={firstName}
                  inputProps={{ readOnly: !isEditing }}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setUpdatedFirst(e.target.value)}
                  sx={textFieldStyles(isEditing)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="lastname"
                  label="Last Name"
                  variant="outlined"
                  value={updatedLast}
                  placeholder={lastName}
                  inputProps={{ readOnly: !isEditing }}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setUpdatedLast(e.target.value)}
                  sx={textFieldStyles(isEditing)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email (not editable)"
                  type="email"
                  variant="outlined"
                  value={email}
                  disabled
                  
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="phone"
                  label="Phone Number"
                  variant="outlined"
                  type="tel"
                  fullWidth
                  placeholder={phoneNumber}
                  value={updatedPhoneNumber}
                  inputProps={{ readOnly: !isEditing }}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setUpdatedPhoneNumber(e.target.value)}
                  sx={textFieldStyles(isEditing)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="department"
                  label="Department"
                  fullWidth
                  placeholder={department}
                  value={updatedDepartment}
                  inputProps={{ readOnly: !isEditing }}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setUpdatedDepartment(e.target.value)}
                  sx={textFieldStyles(isEditing)}
                />
              </Grid>
              <Grid item xs={6}>
                  <Select
                    name="degree"
                    fullWidth
                    label="Degree"
                    variant="outlined"
                    placeholder={degree}
                    value={updatedDegree}
                    onChange={(e) => setUpdatedDegree(e.target.value)}
                    displayEmpty
                    inputProps={{ readOnly: !isEditing, shrink: true }}
                    sx={{
                      ...textFieldStyles(isEditing),
                    }}
                  >
                    <MenuItem value="" disabled sx={{ color: '#888' }}>
                      Select Degree
                    </MenuItem>
                    <MenuItem value="BS">BS</MenuItem>
                    <MenuItem value="BS/MS">BS/MS</MenuItem>
                    <MenuItem value="MS">MS</MenuItem>
                    <MenuItem value="PhD">PhD</MenuItem>
                  </Select>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="gpa"
                  label="GPA"
                  variant="outlined"
                  fullWidth
                  type="number"
                  placeholder={gpa.toString()}
                  value={updatedGpa}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    step: 0.1,
                    min: 0.0,
                    max: 4.0,
                    readOnly: !isEditing,
                  }}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (value >= 0.0 && value <= 4.0) {
                      setUpdatedGpa(e.target.value);
                    }
                  }}
                  sx={textFieldStyles(isEditing)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="graduationDate"
                  label="Graduation Date"
                  fullWidth
                  placeholder={graduationDate}
                  value={updatedGraduationDate}
                  inputProps={{ readOnly: !isEditing }}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setUpdatedGraduationDate(e.target.value)}
                  sx={textFieldStyles(isEditing)}
                />
              </Grid>
            </Grid>
          </form>
        </div>
      </div>
    </>
  );
}
