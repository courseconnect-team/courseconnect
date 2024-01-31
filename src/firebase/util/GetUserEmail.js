// given a user ID, this function returns the email of that user

import { useEffect, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import { useDocument } from 'react-firebase-hooks/firestore';

const GetUserEmail = (userId) => {
  const [email, setEmail] = useState('');

  const [snapshot, loading, error] = useDocument(
    firebase.firestore().collection('users').doc(userId)
  );

  useEffect(() => {
    if (snapshot) {
      const data = snapshot.data();
      if (data) {
        setEmail(data.email);
      }
    }
  }, [snapshot]);

  return email;
};

export default GetUserEmail;
