import firebase from '../firebase_config';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();

function handleSignIn(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      console.log('User signed in successfully!');

      window.location = '/dashboard';
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign in error: ', errorCode, errorMessage);
    });
}

export default handleSignIn;
