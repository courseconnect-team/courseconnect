'use client';
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DepartmentSelect from '@/components/FormUtil/DepartmentSelect';
import GPA_Select from '@/components/FormUtil/GPASelect';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import DegreeSelect from '@/components/FormUtil/DegreeSelect';
import SemesterStatusSelect from '@/components/FormUtil/SemesterStatusSelect';
import NationalitySelect from '@/components/FormUtil/NationalitySelect';
import ProficiencySelect from '@/components/FormUtil/ProficiencySelect';
import PositionSelect from '@/components/FormUtil/PositionSelect';
import AvailabilityCheckbox from '@/components/FormUtil/AvailabilityCheckbox';
import SemesterCheckbox from '@/components/FormUtil/SemesterCheckbox';
import AdditionalSemesterPrompt from '@/components/FormUtil/AddtlSemesterPrompt';
import UpdateRole from '@/firebase/util/UpdateUserRole';
import { useAuth } from '@/firebase/auth/auth_context';
import { Toaster, toast } from 'react-hot-toast';
import { LinearProgress } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { ApplicationStatusCard } from '@/components/ApplicationStatusCard/ApplicationStatusCard';
import { useState } from 'react';
import { TopNavBarSigned } from '@/components/TopNavBarSigned/TopNavBarSigned';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';
import GetUserRole from '@/firebase/util/GetUserRole';
import GetUserUfid from '@/firebase/util/GetUserUfid';
import { ApplicationStatusCardDenied } from '@/components/ApplicationStatusCardDenied/ApplicationStatusCardDenied';

import { ApplicationStatusCardAccepted } from '@/components/ApplicationStatusCardAccepted/ApplicationStatusCardAccepted';
import styles from "./style.module.css";
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { query, where, collection, getDocs } from 'firebase/firestore';
import GetUserName from '@/firebase/util/GetUserName';
import { log } from 'console';
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
  const { user } = useAuth();
  const userId = user.uid;
  const [role, loading, error] = GetUserRole(user?.uid);
  const [ufid, load, err] = GetUserUfid(user?.uid);
  const [applicationData, setApplicationData] = React.useState<Application[]>(
    []
  );
  const [applications, setApplications] = React.useState([]);
  React.useEffect(() => {
    const applicationsRef = firebase.firestore().collection('applications');

    if (role === 'student_applied') {
      applicationsRef.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          //console.log(doc.id, " => ", doc.data());
          //console.log(doc.data().courses);
          if (doc.data().ufid == ufid) {
            console.log(doc.data().courses)
          }
        });
      });



      // the faculty member can only see applications that specify the same class as they have
      // get the courses that the application specifies
      // find the courses that the faculty member teaches
      // if there is an intersection, then the faculty member can see the application

      // find courses that the faculty member teaches


      // now we have every course that the faculty member teaches
      // we need the course code from each of them
      // then we can compare them to the courses that the application specifies
      // if there is an intersection, then the faculty member can see the application

      applicationsRef.get().then((querySnapshot) => {
        const data = querySnapshot.docs.map(
          (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Application)
        );
        setApplicationData(data);
      });
    }
  }, [role, user?.email]);
  return (
    <>
      <Toaster />
      <div className={styles.studentlandingpage}>
        <div className={styles.overlapwrapper}>
          <div className={styles.overlap}>
            <div className={styles.overlap2}>
              <div className={styles.colorblockframe}>
                <div className={styles.overlapgroup2}>
                  <div className={styles.colorblock} />
                  <img className={styles.GRADIENTS} alt="Gradients" src="https://c.animaapp.com/vYQBTcnO/img/gradients.png" />
                  <div className={styles.glasscard} />
                </div>
              </div>
              <EceLogoPng className={styles.ecelogopng2} />
              <TopNavBarSigned className={styles.topnavbarsignedin} />
              <div className={styles.textwrapper8}>Status</div>
            </div>
            <Container className={styles.container} component="main" maxWidth="md">

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

                  {role == 'student_applied' && <ApplicationStatusCard
                    text="TA/UPI"
                    course="All courses"
                  />}
                  {role == 'student_denied' && <ApplicationStatusCardDenied
                    text="TA/UPI"
                    course="All courses"
                  />}
                  {role == 'student_accepted' && <ApplicationStatusCardAccepted
                    text="TA/UPI"
                    course=""
                  />}

                </Box>
              </Box>
            </Container>

          </div>
        </div>
      </div>
    </>

  );
}
