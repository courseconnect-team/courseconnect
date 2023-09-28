import firebase from '../firebase_config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';
const auth = firebase.auth();

async function handleSignIn(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      console.log('User signed in successfully!');
      window.location.href = '/dashboard';
      return true;
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign in error: ', errorCode, errorMessage);
      toast.error('Invalid Login Credentials!');
      return false;
    });
}

export default handleSignIn;
