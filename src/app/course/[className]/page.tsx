'use client';
import { FC, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import './style.css';
import CourseNavBar from '@/components/CourseNavBar/CourseNavBar';
import ApplicantCardApprovedeny from '@/components/ApplicantCardApprovedeny/ApplicantCardApprovedeny';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import CourseDetails from '@/components/CourseDetails/CourseDetails';
interface pageProps {
  params: { className: string; semester: string };
}
interface QueryParams {
  [key: string]: string;
}

const getQueryParams = (query: string): QueryParams => {
  return query
    ? (/^[?#]/.test(query) ? query.slice(1) : query)
        .split('&')
        .reduce((params: QueryParams, param) => {
          let [key, value] = param.split('=');
          params[key] = value
            ? decodeURIComponent(value.replace(/\+/g, ' '))
            : '';
          return params;
        }, {})
    : {};
};

const StatisticsPage: FC<pageProps> = ({ params }) => {
  const [className, setClassName] = useState('none');

  useEffect(() => {
    const params = getQueryParams(window.location.search);
    const data = params.data;

    setClassName(data);
  }, []);

  return (
    <>
      <HeaderCard text="Courses" />
      <CourseDetails
        courseName="COP3502C - Programming Fundamentals 1"
        semester="Fall 2023"
        instructor="Firstname Lastname"
        email="emailaddress@ufl.edu"
        studentsEnrolled={40}
        maxStudents={75}
        credits={4}
        courseCode="#10740"
        department="CISE"
        TAs={[
          { name: 'Firstname Lastname', email: 'emailaddress@ufl.edu' },
          { name: 'Firstname Lastname', email: 'emailaddress@ufl.edu' },
        ]}
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
  );
};

export default StatisticsPage;
