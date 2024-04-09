'use client';
import React, { useState } from 'react';
import { useAuth } from '@/firebase/auth/auth_context';
import { Button } from '@mui/material';
import './style.css';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import DeleteUserButton from './DeleteUserButton';
import { updateProfile } from 'firebase/auth';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

interface ProfileProps {
  userRole: string;
}

const AddClassButton = styled(Button)({
  background: 'white', // Assuming the button has a white background
  borderRadius: '10px', // Adjust your border-radius accordingly
  padding: '6px 24px', // Adjust the padding accordingly
  width: "158", height: "4",
  boxShadow: '0px 4px 35px rgba(0, 0, 0, 0.08)', // Example shadow
  border: '1px black solid',
  textTransform: 'none', // Keeps the button text as-is
  '&:hover': {
    background: 'white', // Keep the background color on hover
    // You can add a different shadow or any other style for hover state
  },
  // If you have other states like "active", you can style them as well
});

export default function Profile(props: ProfileProps) {
  const { user } = useAuth();

  const nameParts = user.displayName.split(' ');

  // Extract first and last names
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  const [updatedFirst, setUpdatedFirst] = useState('');
  const [updatedLast, setUpdatedLast] = useState('');
  const [open, setOpen] = React.useState(false);

  const handleSave = async (e: any) => {
    e.preventDefault(); // Prevent the form from submitting in the traditional way
    if (updatedFirst.trim() !== '' && updatedLast.trim() !== '') {
      try {
        await updateProfile(user, {
          displayName: `${updatedFirst} ${updatedLast}`,
        });
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
  };

  return (
    <>
      <HeaderCard text="Profile" />
      <div style={{ display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginRight: '63px',
          }}
        >
          <div className="full-name-and-bio">
            <div className="ellipse">
              <div className="initials">
                {firstName[0].toUpperCase() + lastName[0].toUpperCase()}
              </div>
            </div>

            <div className="text-wrapper">{user.displayName}</div>
            <div className="div">{user.email}</div>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <DeleteUserButton open={open} setOpen={setOpen} />
          </div>
        </div>
        <div className="rectangle1" />

        <div style={{ marginRight: 'auto' }}>
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="info">BASIC INFO</div>
              <div style={{ display: 'flex', gap: '10px' }}>
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
              </div>
            </div>
            <div className="rectangle2" />
            <div style={{ display: 'flex', marginTop: '41.57px' }}>
              <div className="firstName">First Name </div>
              <div className="lastName">Last Name</div>
            </div>

            <div style={{ display: 'flex', marginTop: '12.71px' }}>
              <div className="firstname-border">
                <input
                  className="firstname-input"
                  type="text"
                  placeholder="First Name"
                  style={{ paddingLeft: '20px' }}
                  onChange={(e) => setUpdatedFirst(e.target.value)}
                  value={updatedFirst}
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
                />
              </div>
            </div>
          </form>
          </div>
        
      </div>
    </>
  );
}
