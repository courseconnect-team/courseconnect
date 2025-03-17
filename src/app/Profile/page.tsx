'use client';
import React, { useState } from 'react';
import { useAuth } from '@/firebase/auth/auth_context';
import { Button } from '@mui/material';
import './style.css';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import DeleteUserButton from './DeleteUserButton';
import { updateProfile } from 'firebase/auth';

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
  // console.log('user', user);

  const nameParts = user.displayName.split(' ');

  // Extract first and last names
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  const [updatedFirst, setUpdatedFirst] = useState('');
  const [updatedLast, setUpdatedLast] = useState('');

  // need to add email
  // add gpa
  // add department
  // add phone number
  // add graduation semester and date

  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = React.useState(false);

  const handleSave = async (e: any) => {
    e.preventDefault(); // Prevent the form from submitting in the traditional way
    if (updatedFirst.trim() !== '' && updatedLast.trim() !== '') {
      try {
        await updateProfile(user, {
          displayName: `${updatedFirst} ${updatedLast}`,
        });
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
    setIsEditing(false);
  };

  return (
    <>
      <HeaderCard text="Profile" />

      <div className="layout">
        <div className="left-section">
          <div className="full-name-and-bio">
            <div className="profile-image">
              {firstName[0].toUpperCase() + lastName[0].toUpperCase()}
            </div>
            <div className="name">{user.displayName}</div>
            <div className="email-address">{user.email}</div>
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
          </form>
        </div>
      </div>
    </>
  );
}
