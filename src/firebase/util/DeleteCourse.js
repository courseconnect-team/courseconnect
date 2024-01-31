// given a class number, this function deletes the course from firestore

import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

async function DeleteCourse(class_number) {
  try {
    const courseRef = firebase
      .firestore()
      .collection('courses')
      .doc(class_number);

    await courseRef.delete();

    console.log(`Course deleted successfully.`);
  } catch (error) {
    console.error('Error deleting course:', error);
  }
}
export default DeleteCourse;
