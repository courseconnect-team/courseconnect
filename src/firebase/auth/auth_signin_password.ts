import firebase from '../firebase_config';
import { signInWithEmailAndPassword } from 'firebase/auth';

const auth = firebase.auth();

function handleSignIn(email: string, password: string) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      console.log('User signed in successfully!');
      window.location.href = '/dashboard';
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign in error: ', errorCode, errorMessage);
    });
}

export default handleSignIn;
