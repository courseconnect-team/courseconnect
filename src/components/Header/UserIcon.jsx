// icons
import PersonIcon from '@mui/icons-material/Person'; // not signed in
import EngineeringIcon from '@mui/icons-material/Engineering'; // admin
import BadgeIcon from '@mui/icons-material/Badge'; // faculty
import SchoolIcon from '@mui/icons-material/School'; // student
import Avatar from '@mui/material/Avatar'; // avatar component to be exported

import React, { useEffect } from 'react';
import { useAuth } from '@/firebase/auth/auth_context';
import firebase from '@/firebase/firebase_config';
import { useDocument } from 'react-firebase-hooks/firestore';

function chooseIcon(role) {
  switch (role) {
    case 'admin':
      return (
        <Avatar sx={{ bgcolor: 'secondary.main' }}>
          <EngineeringIcon />
        </Avatar>
      );
    case 'faculty':
      return (
        <Avatar sx={{ bgcolor: 'secondary.main' }}>
          <BadgeIcon />
        </Avatar>
      );
    case 'student_applying':
    case 'student_applied':
    case 'student_accepted':
    case 'student_assigned':
    case 'student_denied':
      return (
        <Avatar sx={{ bgcolor: 'secondary.main' }}>
          <SchoolIcon />
        </Avatar>
      );
    default:
      return (
        <Avatar sx={{ bgcolor: 'secondary.main' }}>
          <PersonIcon />
        </Avatar>
      );
  }
}

function UserAvatar({ userId }) {
  const { user } = useAuth();
  const db = firebase.firestore();
  const userRef = db.collection('users').doc(userId);
  const [userSnapshot, loading, error] = useDocument(userRef);
  const userData = userSnapshot?.data();
  const role = userData?.role;

  useEffect(() => {
    if (user && user.uid && !loading && !error) {
      userRef.get();
    }
  }, [user, userRef, loading, error]);

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return <>{chooseIcon(role)}</>;
}

export default function UserIcon() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Avatar sx={{ bgcolor: 'secondary.main' }}>
        <PersonIcon />
      </Avatar>
    );
  }

  return <UserAvatar userId={user.uid} />;
}
