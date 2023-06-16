import firebase from '../firebase_config';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const auth = firebase.auth();

function handleSignUp(email: string, password: string): Promise<string> {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in - return UID as string
      const user = userCredential.user;
      console.log('User created and signed in successfully!');
      return user.uid;
    })
    .catch((error) => {
      // Error - return "-1"
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log('Error creating user: ', errorCode, errorMessage);
      return '-1';
    });
}
export default handleSignUp;
