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
import { query, where, collection, getDocs, getDoc } from 'firebase/firestore';
import GetUserName from '@/firebase/util/GetUserName';
import { log } from 'console';
import { firestore } from 'firebase-functions/v1';
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
  const [applicationData, setApplicationData] = React.useState<Application[]>(
    []
  );
  const [applications, setApplications] = React.useState([]);
  const [courses, setCourses] = useState(null);

  React.useEffect(() => {
    async function fetch() {
      const statusRef = db.collection('applications').doc(userId);
      await getDoc(statusRef).then(doc => {
        setCourses(doc.data().courses);
        console.log(courses);
      });

      return;
    }
    if (!courses) {
      fetch()
    }
  }, [courses]);

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

                  {courses &&
                    Object.entries(courses).map(([key, value]) => (
                      <div key={key}>
                        {value == "applied" &&
                          <ApplicationStatusCard
                            text="TA/UPI"
                            course={key}
                          />

                        }
                        {value == "denied" &&
                          <ApplicationStatusCardDenied
                            text="TA/UPI"
                            course={key}
                          />

                        }
                        {value == "accepted" &&
                          <ApplicationStatusCardAccepted
                            text="TA/UPI"
                            course={key}
                          />

                        }

                        <br />
                      </div>


                    ))}


                </Box>
              </Box>
            </Container>

          </div>
        </div>
      </div >
    </>

  );
}
