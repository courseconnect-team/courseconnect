// given a user ID, this function returns the role (student, faculty, admin) of that user

import { useEffect, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import { useDocument } from 'react-firebase-hooks/firestore';

const GetUserUfid = (userId) => {
  const [ufid, setUfid] = useState('');

  const [snapshot, loading, error] = useDocument(
    firebase.firestore().collection('users').doc(userId)
  );

  useEffect(() => {
    if (snapshot) {
      const data = snapshot.data();
      if (data) {
        setUfid(data.ufid);
      }
    }
  }, [snapshot]);

  return [ufid, loading, error];
};

export default GetUserUfid;
