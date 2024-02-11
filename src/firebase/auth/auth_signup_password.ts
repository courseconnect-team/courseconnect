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
  password: string,
): Promise<string> {
  // use fetch to send the user data to the server
  // this goes to a cloud function which creates a document based on
  // the data from the form, identified by the user's firebase auth uid


  var errorTag: string = '';


  try {
    await createUserWithEmailAndPassword(auth, email, password).catch(
      (error) => {
        console.log(error);
        if (error.message.includes('already in use')) {
          errorTag = '-5';
        } else {
          errorTag = '-2';
        }
      }
    );
    if (errorTag != '') {
      return errorTag;
    }
    await sendEmailVerification(auth.currentUser as User).catch((error) => {
      console.log(error);
      errorTag = '-3';
    });
    await updateProfile(auth.currentUser as User, { displayName: name }).catch(
      (error) => {
        console.log(error);

        errorTag = '-4';
      }
    );
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
