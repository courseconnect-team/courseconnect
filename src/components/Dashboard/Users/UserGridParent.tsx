import React, { useEffect, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import UserGrid from './UserGrid';

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  department: string;
  role: string;
  ufid: string;
}

const UserGridParent: React.FC = () => {
  const [userData, setUserData] = useState<User[]>([]);

  useEffect(() => {
    const usersRef = firebase.firestore().collection('users');
    usersRef.get().then((querySnapshot) => {
      const data = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as User)
      );
      setUserData(data);
    });
  }, []);

  return <UserGrid data={userData} />;
};

export default UserGridParent;
