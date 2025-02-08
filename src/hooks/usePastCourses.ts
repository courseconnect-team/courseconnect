import { useEffect, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import { CourseType } from '@/types/User';
const useFetchPastCourses = (
  selectedYear: number,
  uemail: string | null | undefined
) => {
  const [pastCourses, setCourses] = useState<CourseType[]>([]);
  const [loadingPast, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const db = firebase.firestore();

  useEffect(() => {
    const fetchPastCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentYear = new Date().getFullYear();
        const year = currentYear - selectedYear;

        // Helper function to filter and map documents
        const processSnapshot = (
          snapshot: any,
          semesterCode: string
        ): CourseType[] => {
          return snapshot.docs
            .filter((doc: any) => {
              const data = doc.data();
              return data.code !== null && data.code !== undefined;
            })
            .map((doc: any) => {
              const data = doc.data();
              return {
                id: doc.id,
                code: data.code,
                courseId: data.class_number,
                semester: semesterCode,
              };
            });
        };

        // Create and execute queries
        const [springSnapshot, fallSnapshot, summerSnapshot] =
          await Promise.all([
            db
              .collection('past-courses')
              .where('semester', '==', `Spring ${year}`)
              .where('professor_emails', '==', uemail)
              .get(),
            db
              .collection('past-courses')
              .where('semester', '==', `Fall ${year}`)
              .where('professor_emails', '==', uemail)
              .get(),
            db
              .collection('past-courses')
              .where('semester', '==', `Summer ${year}`)
              .where('professor_emails', '==', uemail)
              .get(),
          ]);

        // Process snapshots
        const allCourses = [
          ...processSnapshot(springSnapshot, 'S'),
          ...processSnapshot(fallSnapshot, 'F'),
          ...processSnapshot(summerSnapshot, 'R'),
        ];

        setCourses(allCourses);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPastCourses();
  }, [selectedYear, uemail]);

  return { pastCourses, loadingPast, error };
};

export default useFetchPastCourses;
