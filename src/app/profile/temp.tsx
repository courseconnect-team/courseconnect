'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/firebase/auth/auth_context';
import {
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import './style.css';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import DeleteUserButton from './DeleteUserButton';
import GetUserRole from '@/firebase/util/GetUserRole';
import { updateProfile } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { QrCode2 } from '@mui/icons-material';
import { set } from 'react-hook-form';
import { placeholderCSS } from 'react-select/dist/declarations/src/components/Placeholder';

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
      borderColor: isEditable ? 'black' : '#cecece',
    },
    '&:hover fieldset': {
      borderColor: isEditable ? 'black' : '#cecece',
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
  const [role, loading, error] = GetUserRole(user?.uid);
  const uid = user?.uid as string;
  const db = getFirestore();

  const [isLoading, setIsLoading] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');

  const [gpa, setGpa] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [graduationDate, setGraduationDate] = useState('');
  const [degree, setDegree] = useState('');

  const [updatedFirst, setUpdatedFirst] = useState('');
  const [updatedLast, setUpdatedLast] = useState('');
  const [updatedDepartment, setUpdatedDepartment] = useState('');
  const [updatedGpa, setUpdatedGpa] = useState('');
  const [updatedPhoneNumber, setUpdatedPhoneNumber] = useState('');
  const [updatedGraduationDate, setUpdatedGraduationDate] = useState('');
  const [updatedDegree, setUpdatedDegree] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);

      try {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, where('uid', '==', uid));
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
          setDegree(data.degree || '');
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (uid) {
      fetchUserData();
    }
  }, [db, uid]);

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (firstName.trim() !== '' && lastName.trim() !== '') {
      try {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, where('uid', '==', uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docRef = doc(db, 'users', querySnapshot.docs[0].id);
          const docSnap = querySnapshot.docs[0];
          const currentData = docSnap.data();
          const updatedData: any = {};

          // Always include these fields for all users
          if (updatedFirst.trim() !== '') updatedData.firstname = updatedFirst;
          if (updatedLast.trim() !== '') updatedData.lastname = updatedLast;
          if (updatedDepartment.trim() !== '')
            updatedData.department = updatedDepartment;

          // Only include student fields if user is not faculty
          if (showStudentFields) {
            // For GPA field
            if (updatedGpa.trim() !== '') {
              updatedData.gpa = updatedGpa;
            }

            // For phone number field
            if (updatedPhoneNumber.trim() !== '') {
              updatedData.phonenumber = updatedPhoneNumber;
            }

            // For graduation date field
            if (updatedGraduationDate.trim() !== '') {
              updatedData.graduationdate = updatedGraduationDate;
            }

            // For degree field
            if (updatedDegree.trim() !== '') {
              updatedData.degree = updatedDegree;
            }
          }

          // Only update if there are changes
          if (Object.keys(updatedData).length > 0) {
            await updateDoc(docRef, updatedData);
            console.log('Profile updated successfully');
            alert('Profile updated successfully');
            setIsEditing(false);
            window.location.reload();
          } else {
            console.log('No changes to update');
            alert('No changes detected');
            setIsEditing(false);
          }
        } else {
          // This will only happen if the user ID doesn't exist in the collection
          console.log('No document found for this user ID');
          alert('Profile not found. Please contact support.');
        }
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
    setUpdatedGpa('');
    setUpdatedDepartment('');
    setUpdatedPhoneNumber('');
    setUpdatedGraduationDate('');
    setUpdatedDegree('');
    setIsEditing(false);
  };

  if (loading || isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100%',
          backgroundColor: '#f5f5f5',
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: '#5736ac' }} />
        <Typography
          variant="h6"
          sx={{
            mt: 3,
            fontFamily: 'SF Pro Display-Bold, Helvetica',
            color: '#5736ac',
          }}
        >
          Loading your profile...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100%',
          backgroundColor: '#f5f5f5',
          padding: 3,
        }}
      >
        <Typography variant="h6" color="error" sx={{ textAlign: 'center' }}>
          There was an error loading your profile. Please try again later.
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{
            mt: 2,
            backgroundColor: '#5736ac',
            '&:hover': {
              backgroundColor: '#4a2d91',
            },
          }}
        >
          Refresh Page
        </Button>
      </Box>
    );
  }

  const showStudentFields = role !== 'faculty';

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
              {showStudentFields && (
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
              )}
              <Grid item xs={showStudentFields ? 6 : 12}>
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
              {showStudentFields && (
                <>
                  <Grid item xs={6}>
                    <FormControl fullWidth sx={textFieldStyles(isEditing)}>
                      <InputLabel id="degree-label" shrink={true}>
                        Degree
                      </InputLabel>
                      <Select
                        labelId="degree-label"
                        label="Degree"
                        name="degree"
                        value={isEditing ? updatedDegree : degree}
                        onChange={
                          isEditing
                            ? (e) => setUpdatedDegree(e.target.value)
                            : undefined
                        }
                        disabled={!isEditing}
                        inputProps={{ displayEmpty: true }}
                      >
                        {isEditing ? (
                          <MenuItem value="">
                            <em>Select degree</em>
                          </MenuItem>
                        ) : (
                          <MenuItem value={degree}>
                            <em>{degree}</em>
                          </MenuItem>
                        )}
                        <MenuItem value="BS">BS</MenuItem>
                        <MenuItem value="BS/MS">BS/MS</MenuItem>
                        <MenuItem value="MS">MS</MenuItem>
                        <MenuItem value="PhD">PhD</MenuItem>
                      </Select>
                    </FormControl>
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
                </>
              )}
            </Grid>
          </form>
        </div>
      </div>
    </>
  );
}
