// given a user ID, this function returns the full name of that user

import { useEffect, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import { useDocument } from 'react-firebase-hooks/firestore';

const GetUserNameApp = (userId) => {
  const [name, setName] = useState('');

  const [snapshot, loading, error] = useDocument(
    firebase
      .firestore()
      .collection('applications')
      .doc('course_assistant')
      .collection('uid')
      .doc(userId)
  );

  useEffect(() => {
    if (snapshot) {
      const data = snapshot.data();
      if (data) {
        setName(data.firstname + ' ' + data.lastname);
      }
    }
  }, [snapshot]);

  return name;
};

export default GetUserNameApp;
