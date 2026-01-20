import { isE2EMode } from '@/utils/featureFlags';
import firebase from '../firebase_config';
import 'firebase/compat/auth';

export default async function handleSignUp(
  name: string,
  email: string,
  password: string
): Promise<string> {
  // use fetch to send the user data to the server
  // this goes to a cloud function which creates a document based on
  // the data from the form, identified by the user's firebase auth uid
  if (isE2EMode()) return '';

  var errorTag: string = '';

  const auth = firebase.auth();

  try {
    await auth
      .createUserWithEmailAndPassword(email, password)
      .catch((error) => {
        console.log(error);
        if (error.message.includes('already in use')) {
          errorTag = '-5';
        } else {
          errorTag = '-2';
        }
      });
    if (errorTag != '') {
      return errorTag;
    }
    await auth.currentUser?.sendEmailVerification().catch((error) => {
      console.log(error);
      errorTag = '-3';
    });
    await auth.currentUser
      ?.updateProfile({ displayName: name })
      .catch((error) => {
        console.log(error);

        errorTag = '-4';
      });
    if (errorTag === '') {
      console.log('User created successfully!!!');
      return auth.currentUser?.uid as string;
    } else {
      return errorTag;
    }
  } catch (error) {
    console.log(errorTag);
    console.log('Error creating user: ', error);
  }

  return errorTag;
}
