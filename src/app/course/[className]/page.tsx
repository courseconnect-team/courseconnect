'use client';

import { FC, useEffect, useState } from 'react';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import './style.css';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import CourseDetails from '@/components/CourseDetails/CourseDetails';
import { getAuth } from 'firebase/auth';
import { useUserRole } from '@/firebase/util/GetUserRole';
import { useRouter, useSearchParams } from 'next/navigation';

interface pageProps {
  params: { semester: string; collection: string; courseCode: string };
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
  title: string;
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

  const getCourseDetails = async (
    courseId: string
  ): Promise<CourseDetails | null> => {
    try {
      const db = firebase.firestore(); // Use the existing Firestore instance
      const doc = await db.collection('past-courses').doc(courseId).get();

      if (doc.exists) {
        const data = doc.data();
        return {
          id: doc.id,
          courseName: data?.code || 'N/A',
          instructor: data?.professor_names || 'Unknown',
          email: data?.professor_emails || 'Unknown',
          studentsEnrolled: data?.enrolled || 0,
          maxStudents: data?.enrollment_cap || 0,
          courseCode: data?.class_number || 'N/A',
          TAs: data?.tas || [],
          department: data?.department || 'Unknown',
          credits: data?.credits || 0,
          semester: data?.semester || 'N/A',
          title: data?.title || 'N/A',
        };
      } else {
        throw new Error('No matching documents found');
      }
    } catch (error) {
      console.error('Error getting course details:', error);
      return null;
    }
  };

  useEffect(() => {
    if (courseId) {
      const fetchData = async () => {
        try {
          const result = await getCourseDetails(courseId);
          setCourseData(result);
        } catch (error) {
          console.error('Error fetching data: ', error);
        }
      };

      if (role && !roleLoading) {
        fetchData();
      }
    }
  }, [courseId, role, roleLoading]);

  if (roleError) {
    return <p>Error loading role</p>;
  }

  if (!user) {
    return <p>Please sign in.</p>;
  }

  if (roleLoading || !role || (role !== 'faculty' && role !== 'admin')) {
    return <p>Loading...</p>;
  }

  return (
    <>
      {courseData && (
        <>
          <HeaderCard text="Courses" />
          <div
            style={{
              marginTop: '380px',
            }}
          >
            <CourseDetails
              courseName={courseData.courseName}
              semester={courseData.semester}
              instructor={courseData.instructor}
              email={courseData.email}
              studentsEnrolled={courseData.studentsEnrolled}
              maxStudents={courseData.maxStudents}
              credits={courseData.credits}
              courseCode={courseData.courseCode}
              department={courseData.department}
              TAs={courseData.TAs}
              title={courseData.title}
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
          </div>
        </>
      )}
    </>
  );
};

export default StatisticsPage;
