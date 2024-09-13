'use client';
import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';

import Box from '@mui/material/Box';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import Container from '@mui/material/Container';

import { useAuth } from '@/firebase/auth/auth_context';
import { Toaster } from 'react-hot-toast';

import { ApplicationStatusCard } from '@/components/ApplicationStatusCard/ApplicationStatusCard';
import { useState } from 'react';
import GetUserRole from '@/firebase/util/GetUserRole';
import { ApplicationStatusCardDenied } from '@/components/ApplicationStatusCardDenied/ApplicationStatusCardDenied';
import { ApplicationStatusCardAccepted } from '@/components/ApplicationStatusCardAccepted/ApplicationStatusCardAccepted';
import './style.css';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { getDoc } from 'firebase/firestore';

// note that the application needs to be able to be connected to a specific faculty member
// so that the faculty member can view the application and accept/reject it
// the user can indicate whether or not it is unspecified I suppose?
// but that would leave a little bit of a mess.
// best to parse the existing courses and then have the user select
// from a list of existing courses
// ...yeah that's probably the best way to do it

// todo: If the user role says application denied, then make the general denied box with a
// denied message that leads to a reapplication form.
// If their user role says accepted, then add all of their assignments as accepted
// If nothing then (go throgh their application list and say pending).
//
// todo: add the apply link to all states.
export default function Status() {
  // get the current user's uid
  interface Application {
    id: string;
    additionalprompt: string;
    available_hours: string;
    available_semesters: string;
    courses: string;
    date: string;
    degree: string;
    department: string;
    email: string;
    englishproficiency: string;
    firstname: string;
    gpa: string;
    lastname: string;
    nationality: string;
    phonenumber: string;
    position: string;
    qualifications: string;
    semesterstatus: string;
    ufid: string;
    isNew?: boolean;
    mode?: 'edit' | 'view' | undefined;
  }
  const db = firebase.firestore();
  const { user } = useAuth();
  const userId = user.uid;
  const [role, loading, error] = GetUserRole(user?.uid);

  const [courses, setCourses] = useState(null);
  const [adminDenied, setAdminDenied] = useState(false);

  const [assignment, setAssignment] = useState<string[]>([]);

  React.useEffect(() => {
    async function fetch() {
      let counter = 0; // Start counter at 0 (for the original userId)
      let statusRef2 = db.collection('assignments').doc(userId); // Initial document reference
      let assignmentArray = []; // Temporary array to store all class_codes

      while (true) {
        const doc = await statusRef2.get();

        if (doc.exists) {
          const classCodes = doc.data()?.class_codes;

          // Append class_codes (string) to assignmentArray
          if (classCodes) {
            assignmentArray.push(classCodes); // Append string class_codes
          }
        } else {
          break; // Stop when no more documents are found
        }

        // Move to the next document (userId-1, userId-2, etc.)
        counter++;
        statusRef2 = db.collection('assignments').doc(`${userId}-${counter}`);
      }

      // Update the state with the final array after fetching all documents

      setAssignment(assignmentArray);

      const statusRef = db.collection('applications').doc(userId);
      await getDoc(statusRef).then((doc) => {
        if (doc.data() != null && doc.data() != undefined) {
          setAdminDenied(doc.data()?.status == 'Admin_denied');
          setCourses(doc.data()?.courses);
        }
      });

      return;
    }
    if (!courses) {
      fetch();
    }
  }, [courses]);

  return (
    <>
      <Toaster />
      <HeaderCard text="Status" />
      <Container component="main" maxWidth="md">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box sx={{ mt: 50, mb: 2 }}>
            {courses &&
              adminDenied &&
              Object.entries(courses).map(([key, value]) => (
                <div key={key}>
                  <ApplicationStatusCardDenied
                    className="application-status-card"
                    text="TA/UPI/Grader"
                    course={key}
                  />
                </div>
              ))}

            {assignment &&
              !adminDenied &&
              Object.entries(assignment).map(([key, value]) => (
                <div key={key}>
                  <ApplicationStatusCardAccepted
                    className="application-status-card"
                    text="TA/UPI/Grader"
                    course={value}
                  />
                </div>
              ))}

            {courses &&
              !adminDenied &&
              Object.entries(courses).map(([key, value]) => (
                <div key={key}>
                  {(value == 'applied' || value == 'accepted') && (
                    <ApplicationStatusCard
                      className="application-status-card"
                      text="TA/UPI/Grader"
                      course={key}
                    />
                  )}
                  {value == 'denied' && (
                    <ApplicationStatusCardDenied
                      text="TA/UPI/Grader"
                      course={key}
                    />
                  )}
                </div>
              ))}
          </Box>
        </Box>
      </Container>
    </>
  );
}
