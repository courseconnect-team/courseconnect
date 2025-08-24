'use client';
import React from 'react';
import Container from '@mui/material/Container';
import UnderDevelopment from '@/component/UnderDevelopment';
import DeleteUserButton from './DeleteUserButton';

interface ProfileProps {
  userRole: string;
  user: any;
}

export default function Profile(props: ProfileProps) {
  const { userRole, user } = props;
  // Add state to control the dialog open status
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Container maxWidth="lg">
        <h1>Profile</h1>
        <UnderDevelopment />
        <DeleteUserButton open={open} setOpen={setOpen} />
      </Container>
    </>
  );
}
