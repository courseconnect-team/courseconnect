'use client';
import './style.css';
import React, { useEffect, useState, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import SmallClassCard from '@/components/SmallClassCard/SmallClassCard';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Bio } from '@/components/Bio/Bio';
import { SemesterTimeline } from '@/components/SemesterTimeline/SemesterTimeline';
import useFetchPastCourses from '@/hooks/old/usePastCourses';
import { CourseType } from '@/types/User';
import SemesterSelection from '@/components/SemesterSelection/SemesterSelection';
import { SelectSemester } from '@/types/User';

export default function FacultyCourses() {
  const auth = getAuth();
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true); // Loading state for courses

  const db = firebase.firestore();
  const [selectedSemester, setSelectedSemester] = useState<number>(0);
  const [selectedSemesters, setSelectedSemesters] = useState<SelectSemester[]>(
    () => {
      const stored = localStorage.getItem('selectedSemesters');
      return stored ? JSON.parse(stored) : [];
    }
  );

  useEffect(() => {
    localStorage.setItem(
      'selectedSemesters',
      JSON.stringify(selectedSemesters)
    );
  }, [selectedSemesters]);

  const selectedSemesterValues = useMemo(() => {
    return selectedSemesters.map((option) => option.value);
  }, [selectedSemesters]);
  const [groupedCourses, setGroupedCourses] = useState<
    Map<string, CourseType[]>
  >(new Map());
  const [semesterArray, setSemesterArray] = useState<string[]>([]);
  const user = auth.currentUser;
  const uemail = user?.email;
  const { pastCourses, loadingPast, error } = useFetchPastCourses(
    selectedSemesterValues,
    uemail
  );

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
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
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [uemail]);

  useEffect(() => {
    setCourses(groupedCourses.get(semesterArray[selectedSemester]) || []);
  }, [selectedSemester, groupedCourses]);

  useEffect(() => {
    return () => {
      localStorage.removeItem('selectedSemesters');
    };
  }, []);

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
          {loading ? null : courses.length !== 0 ? (
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
                    courseName={course.code}
                    courseId={course.id}
                    className="class"
                    onGoing={true}
                  />
                </div>
              ))}
            </div>
          ) : (
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
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="text-past">Past Courses:</div>
          <SemesterSelection
            selectedSemesters={selectedSemesters}
            setSelectedSemesters={setSelectedSemesters}
          />

          {loadingPast ? (
            <div>Loading past courses...</div>
          ) : pastCourses.length !== 0 ? (
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
              {pastCourses.map((course, index) => (
                <div
                  key={index}
                  style={{
                    flex: '1 1 calc(33.33% - 10px)', // Adjusts for three cards per row
                    maxWidth: 'calc(33.33% - 10px)',
                  }}
                >
                  <SmallClassCard
                    courseName={course.code}
                    courseId={course.id}
                    className="class"
                    onGoing={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>No past courses available.</div>
          )}
        </div>
      </div>
    </>
  );
}
