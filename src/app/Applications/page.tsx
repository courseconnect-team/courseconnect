'use client';
import './style.css';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import SemesterSelect from './semesterselect';
import ClassCard from '@/components/ClassCard/ClassCard';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function FacultyApplication() {
  const auth = getAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSemester =
    currentMonth < 5 ? 'Spring' : currentMonth < 8 ? 'Summer' : 'Fall';
  const [semester, setSemester] = useState(`${currentSemester} ${currentYear}`);
  const [courses, setCourses] = useState<[string, any][]>([]);
  const db = firebase.firestore();

  const generateSemesterNames = (
    currentSem: string,
    currentYr: number
  ): string[] => {
    const names = [`${currentSemester} ${currentYear}`];
    let semesters = currentSem;
    let years = currentYr;

    for (let i = 0; i < 2; i++) {
      if (semesters === 'Spring') {
        semesters = 'Summer';
      } else if (semesters === 'Summer') {
        semesters = 'Fall';
      } else {
        semesters = 'Spring';
        years = years + 1;
      }
      names.push(`${semesters} ${years}`);
    }
    return names;
  };
  const [semesterNames, setSemesterNames] = useState<string[]>([]);

  useEffect(() => {
    setSemesterNames(generateSemesterNames(currentSemester, currentYear));
  }, []);

  const user = auth.currentUser;
  const uemail = user?.email;

  const getCourses = async (semester: string): Promise<[string, any][]> => {
    try {
      const snapshot = await db
        .collection(`courses`)
        .where('semester', '==', semester)
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getCourses(semester);
        setCourses(result);
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };

    fetchData();
  }, [semester]);

  const mapElement = () => {
    return courses.map((val) => {
      return (
        <div key={val[0]}>
          <ClassCard courseName={val[1]} courseId={val[0]} className="class" />
        </div>
      );
    });
  };
  return (
    <>
      <Toaster />

      <HeaderCard text="Applications" />
      <div className="page-container">
        <div className="text-wrapper-11 ta">TA/UPI/Grader Applications</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="text-wrapper-11 courses">My courses:</div>
          <div style={{ marginRight: '35px' }}>
            <SemesterSelect
              semester={semester}
              setSemester={setSemester}
              names={semesterNames}
            ></SemesterSelect>
          </div>
        </div>
      </div>
      {courses.length !== 0 && (
        <div className="class-cards-container">{mapElement()}</div>
      )}
      {courses.length === 0 && (
        <div
          style={{
            marginTop: '162px',
            marginLeft: '227px',
            marginRight: '227px',
            textAlign: 'center',
            color: 'rgba(0, 0, 0, 0.43)',
            fontSize: 24,
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
