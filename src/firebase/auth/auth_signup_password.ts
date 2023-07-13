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
  ufid: string
): Promise<string> {
  // use fetch to send the user data to the server
  // this goes to a cloud function which creates a document based on
  // the data from the form, identified by the user's firebase auth uid

  const userIDObject = {
    ufid: ufid,
  };

  const response = await fetch(
    'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/checkIfIDInDatabase',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userIDObject),
    }
  );
  if (response.ok) {
    console.log('SUCCESS: UFID does not exist in database.');
  } else {
    console.log('ERROR: Inputted UFID already exists in database.');
    return '-1';
  }

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
