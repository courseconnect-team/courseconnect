'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import { useAuth } from '@/firebase/auth/auth_context';
import { Toaster, toast } from 'react-hot-toast';
import GetUserRole from '@/firebase/util/GetUserRole';

import 'firebase/firestore';
import Applications from '@/components/Dashboard/Applications/Applications';
import HeaderCard from '@/components/HeaderCard/HeaderCard';

export default function AdminApplications() {
  let { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);

  return (
    <>
      <Toaster />
      <HeaderCard text="Applications & Assignments" />
      <Box
        sx={{
          marginTop: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Box sx={{ mt: 50, mb: 2, width: '120%' }}>
          <Applications userRole={role as string} />
        </Box>
      </Box>
    </>
  );
}
