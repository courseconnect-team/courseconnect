import firebase from '../firebase_config';
import { signOut } from 'firebase/auth';

const auth = firebase.auth();

function handleSignOut() {
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      console.log('User signed out successfully!');
      window.location.href = '/';
    })
    .catch((error) => {
      // An error happened.
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign in error: ', errorCode, errorMessage);
    });
}

export default handleSignOut;
