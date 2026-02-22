import { callFunction } from '@/firebase/functions/callFunction';

export const deleteUserHTTPRequest = async (id: string) => {
  // use fetch to send the user's auth ID to the server
  // this goes to a cloud function which deletes the user from firebase auth,
  // officially deleting their account

  const userObject = {
    auth_id: id,
  };

  try {
    await callFunction('deleteUserFromID', userObject);
    console.log('SUCCESS: User deleted successfully');
  } catch (error) {
    console.error(error);
    console.log('ERROR: User not deleted');
  }
};
