import { useEffect, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import { useDocument } from 'react-firebase-hooks/firestore';

const GetUserRole = (userId) => {
  const [role, setRole] = useState('');

  const [snapshot, loading, error] = useDocument(
    firebase.firestore().collection('users').doc(userId)
  );

  useEffect(() => {
    if (snapshot) {
      const data = snapshot.data();
      if (data) {
        setRole(data.role);
      }
    }
  }, [snapshot]);

  return [role, loading, error];
};

export default GetUserRole;
