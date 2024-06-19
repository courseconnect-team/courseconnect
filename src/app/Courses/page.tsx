'use client';
import './style.css';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import SmallClassCard from '@/components/SmallClassCard/SmallClassCard';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Bio } from '@/components/Bio/Bio';
import styles from './style.module.css';
import { Timeline } from '@/components/Timeline/Timeline';
import { Class } from '@mui/icons-material';
export default function FacultyApplication() {
  type CourseType = [string, string]; // Define the type for courses

  const auth = getAuth();
  const [courses, setCourses] = useState<CourseType[]>([]); // Use the defined type for state
  const db = firebase.firestore();
  const [selectedYear, setSelectedYear] = useState<number>(1);
  // Reactively listen to auth state changes
  const user = auth.currentUser;
  const uemail = user?.email;

  useEffect(() => {
    if (uemail) {
      fetchCourses();
    }
  }, [uemail]);

  const fetchCourses = async () => {
    const courses = await getCourses();
    setCourses(courses);
  };

  const getCourses = async (): Promise<CourseType[]> => {
    try {
      const snapshot = await db
        .collection('courses')
        .where('professor_emails', '==', uemail) // Check if the current user is the instructor
        .get();

      const filteredDocs = snapshot.docs.filter(
        (doc) => doc.data().code !== null && doc.data().code !== undefined
      );

      return filteredDocs.map((doc) => [doc.id, doc.data().code]);
    } catch (error) {
      console.error(`Error getting courses:`, error);
      alert('Error getting courses:');
      return [];
    }
  };

  const getPastCourses = async (): Promise<CourseType[]> => {
    try {
      const snapshot = await db
        .collection('courses')
        .where('professor_emails', '==', uemail) // Check if the current user is the instructor
        .get();

      const filteredDocs = snapshot.docs.filter(
        (doc) => doc.data().code !== null && doc.data().code !== undefined
      );

      return filteredDocs.map((doc) => [doc.id, doc.data().code]);
    } catch (error) {
      console.error(`Error getting courses:`, error);
      alert('Error getting courses:');
      return [];
    }
  };

  const mapElement = () => {
    return courses.map((val) => {
      return (
        <div key={val[0]}>
          <SmallClassCard
            pathname={`/course/${encodeURIComponent(val[0])}`}
            courseName={val[1]}
            courseId={val[0]}
            className="class"
          />
        </div>
      );
    });
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
            justifyContent: 'space-between',
            flexDirection: 'column',
            marginLeft: '30px',
          }}
        >
          <div className="text-wrapper-11 courses">My courses:</div>
          {courses.length !== 0 && (
            <div className="class-cards-container">{mapElement()}</div>
          )}
        </div>

        <div
          style={{
            paddingLeft: '30px',
            paddingRight: 'auto',
            marginTop: '15px',
          }}
        >
          <div className="text-past">Past Courses:</div>
          <Timeline
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />

          {courses.length !== 0 && (
            <div className="class-cards-container1">{mapElement()}</div>
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
