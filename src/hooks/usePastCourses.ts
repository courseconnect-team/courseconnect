import { useEffect, useRef, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import { CourseType } from '@/types/User';

const useFetchPastCourses = (
  selectedYears: string[],
  uemail: string | null | undefined
) => {
  const [pastCourses, setPastCourses] = useState<CourseType[]>([]);
  const [loadingPast, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const db = firebase.firestore();
  const coursesCache = useRef<{ [semester: string]: CourseType[] }>({});

  useEffect(() => {
    const fetchPastCourses = async () => {
      // If no email or no selected semester, clear courses and exit.
      if (!uemail || selectedYears.length === 0) {
        setPastCourses([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Helper function to process each Firestore snapshot.
        const processSnapshot = (
          snapshot: firebase.firestore.QuerySnapshot,
          semester: string
        ): CourseType[] => {
          const courses = snapshot.docs
            .filter((doc) => {
              const data = doc.data();
              return data.code != null;
            })
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                code: data.code,
                courseId: data.class_number,
                semester,
              } as CourseType;
            });
          // Cache the courses for this semester.
          coursesCache.current[semester] = courses;
          return courses;
        };

        // Create a promise for each semester.
        const queryPromises = selectedYears.map((semester) => {
          if (coursesCache.current[semester]) {
            // Return cached data if it exists.
            return Promise.resolve(coursesCache.current[semester]);
          }

          return db
            .collection('past-courses')
            .where('semester', '==', semester)
            .where('professor_emails', '==', uemail)
            .get()
            .then((snapshot) => processSnapshot(snapshot, semester))
            .catch((error) => {
              console.error(`Error fetching courses for ${semester}:`, error);
              return []; // Return empty array for this semester on error.
            });
        });

        // Wait for all queries to complete.
        const coursesPerSemester = await Promise.all(queryPromises);
        // Flatten the array of arrays into one array.
        const allCourses = coursesPerSemester.flat();
        setPastCourses(allCourses);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPastCourses();
  }, [JSON.stringify(selectedYears), uemail]); // Use a stable dependency for selectedYears

  return { pastCourses, loadingPast, error };
};

export default useFetchPastCourses;
