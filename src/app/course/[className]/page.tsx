'use client';
import { FC, useEffect, useState } from 'react';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import './style.css';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import CourseDetails from '@/components/CourseDetails/CourseDetails';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useUserRole } from '@/firebase/util/GetUserRole';
import { useRouter, useSearchParams } from 'next/navigation';

interface pageProps {
  params: { semester: string; collection: string; courseCode: string };
}
interface QueryParams {
  [key: string]: string;
}
interface TA {
  name: string;
  email: string;
}

interface Schedule {
  day: string;
  time: string;
  location: string;
}

interface CourseDetails {
  id: string;
  courseName: string;
  instructor: string;
  email: string;
  studentsEnrolled: number;
  maxStudents: number;
  courseCode: string;
  TAs: TA[];
  department: string;
  credits: number;
  semester: string;
}

const StatisticsPage: FC<pageProps> = ({ params }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();
  const searchParams = useSearchParams();

  const courseId = searchParams.get('courseId');
  const {
    role,
    loading: roleLoading,
    error: roleError,
  } = useUserRole(user?.uid);

  const [courseData, setCourseData] = useState<CourseDetails | null>(null);

  const db = firebase.firestore();

  const getCourseDetails = async (): Promise<CourseDetails | null> => {
    try {
      const snapshot = await db
        .collection(params.collection)
        .where('number', '==', courseId)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          courseName: doc.data().code,
          instructor: doc.data().professor_names,
          email: doc.data().professor_emails,
          studentsEnrolled: doc.data().enrolled,
          maxStudents: doc.data().enrollment_cap,
          courseCode: doc.data().courseId,
          TAs: doc.data().tas,
          department: doc.data().department,
          credits: doc.data().credits,
          semester: doc.data().semester,
        };
      } else {
        throw new Error('No matching documents found');
      }
    } catch (error) {
      console.error(`Error getting applicants: `, error);
      return null;
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getCourseDetails();
        setCourseData(result);
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };
    if (role && !roleLoading) {
      fetchData();
    }
  }, [courseId]);

  if (roleError) {
    return <p>Error loading role</p>;
  }

  if (!user) {
    return <p>Please sign in.</p>;
  }

  if (role !== 'faculty' && role !== 'admin') {
    return <p>Access denied.</p>;
  }

  return (
    <>
      {courseData && (
        <>
          <HeaderCard text="Courses" />
          <CourseDetails
            courseName={courseData.courseName}
            semester={courseData.courseName}
            instructor={courseData.courseName}
            email={courseData.courseName}
            studentsEnrolled={courseData.studentsEnrolled}
            maxStudents={courseData.maxStudents}
            credits={courseData.credits}
            courseCode={params.courseCode}
            department={courseData.department}
            TAs={courseData.TAs}
            schedule={[
              {
                day: 'T',
                time: 'Periods 8-9 (3:00 PM - 4:55 PM)',
                location: 'CAR 0100',
              },
              {
                day: 'W',
                time: 'Periods 10-11 (5:10 PM - 7:05 PM)',
                location: 'CSE E312',
              },
              {
                day: 'R',
                time: 'Periods 9 (4:05 PM - 4:55 PM)',
                location: 'CAR 0100',
              },
            ]}
          />
        </>
      )}
    </>
  );
};

export default StatisticsPage;
