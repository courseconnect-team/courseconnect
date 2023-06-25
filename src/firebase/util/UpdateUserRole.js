// given a user ID, this function returns the role (student, faculty, admin) of that user

import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

async function UpdateRole(user_id, new_role) {
  try {
    const userRef = firebase.firestore().collection('users').doc(user_id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    await userRef.update({ role: new_role });

    console.log(`Role updated successfully for user ${user_id}`);
  } catch (error) {
    console.error('Error updating role:', error);
  }
}
export default UpdateRole;
