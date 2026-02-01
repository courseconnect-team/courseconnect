'use client';
import * as React from 'react';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';
import handleSignOut from '../../firebase/auth/auth_signout';

export default function IconLabelButtons() {
  return (
    <Button
      onClick={handleSignOut}
      variant="contained"
      startIcon={<LogoutIcon />}
    >
      Logout
    </Button>
  );
}
