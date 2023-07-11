import firebase from '../firebase_config';
import {
  User,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';

const auth = firebase.auth();

export default async function handleSignUp(
  name: string,
  email: string,
  password: string
): Promise<string> {
  try {
    await createUserWithEmailAndPassword(auth, email, password).catch(
      (error) => {
        console.log(error);
      }
    );
    await sendEmailVerification(auth.currentUser as User).catch((error) => {
      console.log(error);
    });
    await updateProfile(auth.currentUser as User, { displayName: name }).catch(
      (error) => {
        console.log(error);
      }
    );
    console.log('User created successfully!');
    return auth.currentUser?.uid as string;
  } catch (error) {
    console.log('Error creating user: ', error);
  }

  return '-1';
}
