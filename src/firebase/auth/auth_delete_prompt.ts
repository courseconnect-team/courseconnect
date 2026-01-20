import firebase from '../firebase_config';
import 'firebase/compat/auth';
import { deleteUserHTTPRequest } from './auth_delete_user';

const auth = firebase.auth();

// TODO(you): prompt the user to re-provide their sign-in credentials
export async function HandleDeleteUser(email: string, password: string) {
  const credential = firebase.auth.EmailAuthProvider.credential(
    email,
    password
  );
  const user = auth.currentUser;

  user
    ?.reauthenticateWithCredential(credential)
    .then(async () => {
      console.log('User re-authenticated.');
      // now that the user is re-authenticated, they may be deleted.
      await deleteUserHTTPRequest(user?.uid as string);
      console.log('User deleted!');
      // once the user is deleted, navigate to the home page.
      location.href = '/';
    })
    .catch((error) => {
      // error handling
      console.log('Error re-authenticating user: ', error);
    });
}
