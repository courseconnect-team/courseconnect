import firebase from '../firebase_config';
import 'firebase/compat/auth';
import toast, { Toaster } from 'react-hot-toast';
import { isE2EMode } from '@/utils/featureFlags';
var tag: boolean = true;

async function handleSignIn(email: string, password: string): Promise<boolean> {
  if (isE2EMode()) return true;
  const auth = firebase.auth();

  await auth
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      console.log('User signed in successfully!');
      window.location.href = '/dashboard';
      tag = true;
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign in error: ', errorCode, errorMessage);
      toast.error('Invalid Login Credentials!');
      tag = false;
    });
  return tag;
}

export default handleSignIn;
