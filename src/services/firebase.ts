/**
 * Firebase service singleton
 * Provides centralized access to Firebase services
 */
import firebase from '@/firebase/firebase_config';

// Export singleton instances
export const db = firebase.firestore();
export const storage = firebase.storage();
export const auth = firebase.auth();

// Export firebase instance for backward compatibility
export default firebase;
