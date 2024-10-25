'use client';
import './style.css';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import SmallClassCard from '@/components/SmallClassCard/SmallClassCard';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Bio } from '@/components/Bio/Bio';
import { Timeline } from '@/components/Timeline/Timeline';

interface CourseType {
  id: string;
  code: string;
  courseId: string;
}

export default function FacultyCourses() {
  const auth = getAuth();
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [pastCourses, setPastCourses] = useState<CourseType[]>([]);

  const db = firebase.firestore();
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const user = auth.currentUser;
  const uemail = user?.email;

  useEffect(() => {
    if (uemail) {
      fetchCourses();
      fetchPastCourses;
    }
  }, [uemail]);

  useEffect(() => {
    fetchPastCourses();
  }, [selectedYear]);

  const fetchCourses = async () => {
    const courses = await getCourses();
    setCourses(courses);
  };

  const fetchPastCourses = async () => {
    const pastCourses = await getPastCourses(selectedYear);
    setPastCourses(pastCourses);
  };

  const getCourses = async (): Promise<CourseType[]> => {
    try {
      const snapshot = await db
        .collection('courses')
        .where('professor_emails', '==', uemail)
        .get();

      const filteredDocs = snapshot.docs.filter(
        (doc) => doc.data().code !== null && doc.data().code !== undefined
      );

      const courses = filteredDocs.map((doc) => ({
        id: doc.id,
        code: doc.data().code,
        courseId: doc.data().class_number,
      }));

      return courses;
    } catch (error) {
      console.error('Error getting courses:', error);
      alert('Error getting courses');
      return [];
    }
  };

  const getPastCourses = async (
    selectedYear: number
  ): Promise<CourseType[]> => {
    try {
      const currentYear = new Date().getFullYear();
      const year = currentYear - selectedYear;

      const springQuery = db
        .collection('past-courses')
        .where('semester', '==', `Spring ${year}`)
        .where('professor_emails', '==', uemail)
        .get();

      const fallQuery = db
        .collection('past-courses')
        .where('semester', '==', `Fall ${year}`)
        .where('professor_emails', '==', uemail)
        .get();

      const [springSnapshot, fallSnapshot] = await Promise.all([
        springQuery,
        fallQuery,
      ]);

      const courses: CourseType[] = [];

      const springFilter = springSnapshot.docs.filter(
        (doc) => doc.data().code !== null && doc.data().code !== undefined
      );
      springFilter.forEach((doc) => {
        courses.push({
          id: doc.id,
          code: doc.data().code,
          courseId: doc.data().class_number,
        });
      });

      const fallFilter = fallSnapshot.docs.filter(
        (doc) => doc.data().code !== null && doc.data().code !== undefined
      );

      fallFilter.forEach((doc) => {
        courses.push({
          id: doc.id,
          code: doc.data().code,
          courseId: doc.data().class_number,
        });
      });

      return courses;
    } catch (error) {
      console.error('Error getting courses:', error);
      alert('Error getting courses');
      return [];
    }
  };

  return (
    <>
      <Toaster />
      <HeaderCard text="Courses" />
      <Bio user={user} className="full-name-and-bio-instance" />
      <div className="page-container">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: '20px',
          }}
        >
          <div className="text-wrapper-11 courses">My courses:</div>
          {courses.length !== 0 && (
            <div
              className="class-cards-container"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                minWidth: '630px',
                maxWidth: '100px',
              }}
            >
              {courses.map((course, index) => (
                <div
                  key={index}
                  style={{
                    flex: '1 1 calc(33.33% - 10px)', // Adjusts for three cards per row
                    maxWidth: 'calc(33.33% - 10px)',
                  }}
                >
                  <SmallClassCard
                    pathname={`/course/${encodeURIComponent(course.id)}`}
                    courseName={course.code}
                    courseId={course.id}
                    className="class"
                    onGoing={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: '15px',
            width: '700px',
          }}
        >
          <div className="text-past">Past Courses:</div>
          <Timeline
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />

          {pastCourses.length !== 0 && (
            <div className="class-cards-container1">
              {pastCourses.map((course, index) => (
                <div
                  key={index}
                  style={{
                    flex: '1 1 calc(33.33% - 10px)', // Adjusts for three cards per row
                    maxWidth: '200px',
                    marginBottom: '-120px', // Adjust this percentage as needed
                  }}
                >
                  <SmallClassCard
                    pathname={`/course/${encodeURIComponent(course.id)}`}
                    courseName={course.code}
                    courseId={course.id}
                    className="class"
                    onGoing={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {courses.length === 0 && (
        <div
          style={{
            marginTop: '162px',
            marginLeft: '227px',
            marginRight: '227px',
            textAlign: 'center',
            color: 'rgba(0, 0, 0, 0.43)',
            fontSize: 17,
            fontFamily: 'SF Pro Display',
            fontWeight: '500',
          }}
        >
          Currently, no courses have been assigned to you yet. Please wait until
          an admin assigns your courses. Once your courses are assigned,
          you&apos;ll be able to access applicants for those classes.
        </div>
      )}
    </>
  );
}
