import { useEffect, useState } from 'react';
import 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import firebase from '@/firebase/firebase_config';

interface UseFetchAssignmentsResult {
  assignments: string[];
  courses: any;
  adminDenied: boolean;
  loading: boolean;
  error: string | null;
}

export function useFetchAssignments(
  userId: string | undefined
): UseFetchAssignmentsResult {
  const [assignments, setAssignments] = useState<string[]>([]);
  const [courses, setCourses] = useState<any>(null);
  const [adminDenied, setAdminDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = firebase.firestore();

  useEffect(() => {
    async function fetch() {
      try {
        if (!userId) return;

        let counter = 0;
        let statusRef = db.collection('assignments').doc(userId);
        const assignmentArray: string[] = [];

        while (true) {
          const doc = await statusRef.get();
          if (!doc.exists) break;

          const classCodes = doc.data()?.class_codes;
          if (classCodes) assignmentArray.push(classCodes);

          counter++;
          statusRef = db.collection('assignments').doc(`${userId}-${counter}`);
        }

        setAssignments(assignmentArray);

        const appRef = db.collection('applications').doc(userId);
        const appDoc = await getDoc(appRef);

        if (appDoc.exists()) {
          setAdminDenied(appDoc.data()?.status === 'Admin_denied');
          setCourses(appDoc.data()?.courses);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    }

    if (userId) fetch();
  }, [userId]);

  return { assignments, courses, adminDenied, loading, error };
}
