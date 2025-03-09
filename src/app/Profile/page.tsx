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

export default function Profile(props: ProfileProps) {
  const { user } = useAuth();

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
      <div className="profile-container">
        <div className="profile-left-section">
          <div className="full-name-and-bio">
            <div className="ellipse">
              <div className="initials">
                {firstName[0].toUpperCase() + lastName[0].toUpperCase()}
              </div>
            </div>

            <div className="text-wrapper">{user.displayName}</div>
            <div className="div">{user.email}</div>
            <div style={{ marginTop: '15px' }}>
              <DeleteUserButton open={open} setOpen={setOpen} />
            </div>
          </div>
        </div>
        <div className="rectangle1" />

        <div className="buttonContainerProfile">
          <form onSubmit={handleSave}>
            <div className="profileLineContainer">
              <div className="info">BASIC INFO</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {!isEditing ? (
                    <Button
                      style={{
                        borderRadius: '10px',
                        height: '37px',
                        width: '71px',
                        textTransform: 'none',
                        fontFamily: 'SF Pro Display-Bold , Helvetica',
                        backgroundColor: '#5736ac',
                        color: '#ffffff',
                      }}
                      variant="contained"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        style={{
                          borderRadius: '10px',
                          height: '37px',
                          width: '71px',
                          textTransform: 'none',
                          fontFamily: 'SF Pro Display-Bold , Helvetica',
                          borderColor: '#5736ac',
                          color: '#5736ac',
                        }}
                        variant="outlined"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button
                        style={{
                          borderRadius: '10px',
                          height: '37px',
                          width: '71px',
                          textTransform: 'none',
                          fontFamily: 'SF Pro Display-Bold , Helvetica',
                          backgroundColor: '#5736ac',
                          color: '#ffffff',
                        }}
                        type="submit"
                        variant="contained"
                      >
                        Save
                      </Button>
                    </>
                  )}
              </div>
            </div>
            <div className="rectangle2" />
            <div style={{ display: 'flex', marginTop: '41.57px' }}>
              <div className="firstName">First Name</div>
              <div className="lastName">Last Name</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <div className="firstname-border">
                <input
                  className="firstname-input"
                  type="text"
                  placeholder="First Name"
                  style={{ paddingLeft: '20px' }}
                  onChange={(e) => setUpdatedFirst(e.target.value)}
                  value={updatedFirst}
                  disabled={!isEditing}
                />
              </div>

              <div className="lastname-border">
                <input
                  className="lastname-input"
                  type="text"
                  placeholder="Last Name"
                  style={{ paddingLeft: '20px' }}
                  value={updatedLast}
                  onChange={(e) => setUpdatedLast(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
