import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

export async function markAnnouncementsSeen(userId: string) {
  const userRef = firebase.firestore().collection('users').doc(userId);

  await userRef.set(
    {
      lastSeenAnnouncementsAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
