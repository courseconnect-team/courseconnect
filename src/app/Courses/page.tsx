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
import { SemesterTimeline } from '@/components/SemesterTimeline/SemesterTimeline';
interface CourseType {
  id: string;
  code: string;
  courseId: string;
  semester: string;
}

export default function FacultyCourses() {
  const auth = getAuth();
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [pastCourses, setPastCourses] = useState<CourseType[]>([]);

  const db = firebase.firestore();
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [selectedSemester, setSelectedSemester] = useState<number>(0);
  const [groupedCourses, setGroupedCourses] = useState<
    Map<string, CourseType[]>
  >(new Map());
  const [semesterArray, setSemesterArray] = useState<string[]>([]);
  const user = auth.currentUser;
  const uemail = user?.email;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const snapshot = await db
          .collection('courses')
          .where('professor_emails', 'array-contains', uemail)
          .get();

        const filteredDocs = snapshot.docs.filter(
          (doc) => doc.data().code !== null && doc.data().code !== undefined
        );

        const courses = filteredDocs.map((doc) => ({
          id: doc.id,
          code: doc.data().code,
          courseId: doc.data().class_number,
          semester: doc.data().semester,
        }));

        const courseMap = new Map<string, CourseType[]>();
        courses.forEach((course) => {
          if (!courseMap.has(course.semester)) {
            courseMap.set(course.semester, []);
          }
          courseMap.get(course.semester)?.push(course);
        });
        setGroupedCourses(courseMap);
        const semesterKeys = Array.from(courseMap.keys());
        const order = ['Fall', 'Spring', 'Summer'];
        const sortedSemesterKeys = semesterKeys.sort(
          (a, b) =>
            order.indexOf(a.split(' ')[0]) - order.indexOf(b.split(' ')[0])
        );
        setSemesterArray(sortedSemesterKeys);
      } catch (error) {}
    };
    fetchCourses();
  }, [uemail]);

  useEffect(() => {
    setCourses(groupedCourses.get(semesterArray[selectedSemester]) || []);
  }, [selectedSemester]);

  useEffect(() => {
    const fetchPastCourses = async () => {
      const pastCourses = await getPastCourses(selectedYear);
      setPastCourses(pastCourses);
    };
    fetchPastCourses();
  }, [selectedYear]);

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

      const summerQuery = db
        .collection('past-courses')
        .where('semester', '==', `Summer ${year}`)
        .where('professor_emails', '==', uemail)
        .get();

      const [springSnapshot, fallSnapshot, summerSnapshot] = await Promise.all([
        springQuery,
        fallQuery,
        summerQuery,
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
          semester: 'S',
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
          semester: 'F',
        });
      });

      const summerFilter = summerSnapshot.docs.filter(
        (doc) => doc.data().code !== null && doc.data().code !== undefined
      );

      summerFilter.forEach((doc) => {
        courses.push({
          id: doc.id,
          code: doc.data().code,
          courseId: doc.data().class_number,
          semester: 'R',
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
          {semesterArray.length > 0 && (
            <SemesterTimeline
              semesters={semesterArray}
              selectedSemester={selectedSemester}
              setSelectedSemester={setSelectedSemester}
            />
          )}
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
          {courses.length === 0 && (
            <div
              style={{
                marginTop: '10px',
                marginLeft: 'auto',
                marginRight: 'auto',
                maxWidth: '600px',
                textAlign: 'center',
                color: 'rgba(0, 0, 0, 0.43)',
                fontSize: 17,
                fontFamily: 'SF Pro Display',
                fontWeight: '500',
                padding: '0 20px',
              }}
            >
              Currently, no courses have been assigned to you yet. Please wait
              until an admin assigns your courses. Once your courses are
              assigned, you&apos;ll be able to access applicants for those
              classes.{' '}
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
                    marginLeft: '11px',
                  }}
                >
                  <SmallClassCard
                    pathname={`/course/${encodeURIComponent(course.id)}`}
                    courseName={course.code + ' ' + course.semester}
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
    </>
  );
}
