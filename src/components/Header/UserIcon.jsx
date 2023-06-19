// icons
import PersonIcon from '@mui/icons-material/Person'; // not signed in
import EngineeringIcon from '@mui/icons-material/Engineering'; // admin
import BadgeIcon from '@mui/icons-material/Badge'; // faculty
import BackpackIcon from '@mui/icons-material/Backpack'; // student
import Avatar from '@mui/material/Avatar'; // avatar component to be exported

import React, { useEffect } from 'react';
import { useAuth } from '@/firebase/auth/auth_context';
import firebase from '@/firebase/firebase_config';
import { useDocument } from 'react-firebase-hooks/firestore';

function chooseIcon(role) {
  switch (role) {
    case 'admin':
      return (
        <Avatar>
          <EngineeringIcon />
        </Avatar>
      );
    case 'faculty':
      return (
        <Avatar>
          <BadgeIcon />
        </Avatar>
      );
    case 'student':
      return (
        <Avatar>
          <BackpackIcon />
        </Avatar>
      );
    default:
      return (
        <Avatar>
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
      <Avatar>
        <PersonIcon />
      </Avatar>
    );
  }

  return <UserAvatar userId={user.uid} />;
}
