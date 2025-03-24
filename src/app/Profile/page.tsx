'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/firebase/auth/auth_context';
import { Button, TextField } from '@mui/material';
import './style.css';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import DeleteUserButton from './DeleteUserButton';
import { updateProfile } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { collection, query, where, getDocs } from "firebase/firestore";
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

  const [updatedFirst, setUpdatedFirst] = useState('');
  const [updatedLast, setUpdatedLast] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');
  const [updatedGpa, setUpdatedGpa] = useState('');
  const [updatedDepartment, setUpdatedDepartment] = useState('');
  const [updatedPhoneNumber, setUpdatedPhoneNumber] = useState('');
  const [updatedGraduationDate, setUpdatedGraduationDate] = useState('');

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
          if (updatedDepartment.trim() !== '') updatedData.department = updatedDepartment;
          if (updatedPhoneNumber.trim() !== '') updatedData.phonenumber = updatedPhoneNumber;
          if (updatedGraduationDate.trim() !== '') updatedData.graduationdate = updatedGraduationDate;

        await updateDoc(docRef, updatedData);
          console.log('Profile updated successfully');
        }
        else {
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
            <div className="name">{firstName + " " + lastName}</div>
            <div className="email-address">{email}</div>
            <DeleteUserButton open={open} setOpen={setOpen}/>
          </div>
        </div>

        <div className="right-section">
          <form className="profile-container" onSubmit={handleSave}>
            <div className='row'> 
              <div className="title">Personal Information</div>
                <div className='button-container'>
                  {!isEditing ? (
                    <Button variant="contained" style={primaryButtonStyle} onClick={() => setIsEditing(true)}>
                        Edit
                    </Button>
                    ) : (
                    <>
                      <Button variant="outlined" style={secondaryButtonStyle} onClick={handleCancel}>
                        Cancel
                        </Button>
                        <Button type="submit" variant="contained" style={primaryButtonStyle} onClick={handleSave}>
                        Save
                        </Button>
                    </>
                    )}
                </div>
              </div>

            <div className='row'>
              <div className="firstName">First Name</div>
              <div className="lastName">Last Name</div>
            </div>

            <div className='row'>
              <div className="firstname-border">
                {!isEditing ? (
                  <div className='firstName'>{firstName}</div>
                ) : (
                  <input
                    className="firstname-input"
                    type="text"
                    placeholder={firstName}
                    onChange={(e) => setUpdatedFirst(e.target.value)}
                    value={updatedFirst}
                  />
                )}
              </div>

              <div className="lastname-border">
                {!isEditing ? (
                  <div className='lastName'>{lastName}</div>
                ) : (
                  <input
                    className="lastname-input"
                    type="text"
                    placeholder={lastName}
                    onChange={(e) => setUpdatedLast(e.target.value)}
                    value={updatedLast}
                  />
                )}
              </div>
            </div>

            <div className='row'>
              <div className="firstName">Email</div>
              <div className="lastName">Phone Number</div>
            </div>

            <div className='row'>
              <div className="firstname-border">
                {!isEditing ? (
                  <div className='firstName'>{email}</div>
                ) : (
                  <input
                    className="firstname-input"
                    type="text"
                    placeholder={email}
                    onChange={(e) => setUpdatedEmail(e.target.value)}
                    value={updatedEmail}
                  />
                )}
              </div>

              <div className="lastname-border">
                {!isEditing ? (
                  <div className='lastName'>{phoneNumber}</div>
                ) : (
                  <input
                    className="lastname-input"
                    type="text"
                    placeholder={phoneNumber}
                    onChange={(e) => setUpdatedPhoneNumber(e.target.value)}
                    value={updatedPhoneNumber}
                  />
                )}
              </div>
            </div>

            <div className='row'>
              <div className="firstName">GPA</div>
              <div className="lastName">Department</div>
            </div>

            <div className='row'>
              <div className="firstname-border">
                {!isEditing ? (
                  <div className='firstName'>{gpa}</div>
                ) : (
                  <TextField
                    className='gpa-input'
                    size='small'
                    variant='outlined'
                    fullWidth
                    type="number"
                    placeholder={gpa.toString()}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= 0.0 && value <= 4.0) {
                        setUpdatedGpa(e.target.value);
                      }
                    }}
                    value={updatedGpa}
                    inputProps={{ step: 0.1, min: 0.0, max: 4.0 }}
                  />
                )}
              </div>

              <div className="lastname-border">
                {!isEditing ? (
                  <div className='lastName'>{department}</div>
                ) : (
                  <input
                    className="lastname-input"
                    type="text"
                    placeholder={department}
                    onChange={(e) => setUpdatedDepartment(e.target.value)}
                    value={updatedDepartment}
                  />
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
