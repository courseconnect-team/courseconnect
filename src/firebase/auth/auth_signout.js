import firebase from '../firebase_config';
import { getAuth, signOut } from 'firebase/auth';

const auth = getAuth();

function handleSignOut() {
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      console.log('User signed out successfully!');
      window.location = '/';
      // ...
    })
    .catch((error) => {
      // An error happened.
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign in error: ', errorCode, errorMessage);
    });
}

export default handleSignOut;
