import { isE2EMode } from '@/utils/featureFlags';
import firebase from '../firebase_config';
import {
  User,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';

export default async function handleSignUp(
  name: string,
  email: string,
  password: string
): Promise<string> {
  // use fetch to send the user data to the server
  // this goes to a cloud function which creates a document based on
  // the data from the form, identified by the user's firebase auth uid
  if (isE2EMode()) return '';

  let errorTag: string = '';

  const auth = firebase.auth();

  try {
    await createUserWithEmailAndPassword(auth, email, password).catch(
      (error) => {
        if (error.message.includes('already in use')) {
          errorTag = '-5';
        } else {
          errorTag = '-2';
        }
      }
    );
    if (errorTag !== '') {
      return errorTag;
    }
    await sendEmailVerification(auth.currentUser as User).catch(() => {
      errorTag = '-3';
    });
    await updateProfile(auth.currentUser as User, { displayName: name }).catch(
      () => {
        errorTag = '-4';
      }
    );
    if (errorTag === '') {
      return auth.currentUser?.uid as string;
    } else {
      return errorTag;
    }
  } catch {
    // signup failed – errorTag already set by inner .catch handlers
  }

  return errorTag;
}
