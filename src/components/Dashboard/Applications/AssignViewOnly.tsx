import * as React from 'react';

import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { Button, Grid, Input } from '@mui/material';
import Paper from '@mui/material/Paper';
import { table } from 'console';
import { setDoc } from 'firebase/firestore';

export interface AppViewProps {
  uid: string;
}

export default function AppView({ uid }: AppViewProps) {
  const [docData, setDocData] = React.useState<any>(null);
  const [studentName, setStudentName] = React.useState("");
  const [studentEmail, setStudentEmail] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [facultyId, setFacultyId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [hours, setHours] = React.useState<any>(null);
  const [title, setTitle] = React.useState("");
  const [percentage, setPercentage] = React.useState("");
  const [annualRate, setAnnualRate] = React.useState("");
  const [biweeklyRate, setBiweeklyRate] = React.useState("");
  const [targetAmt, setTargetAmt] = React.useState("");
  const [remote, setRemote] = React.useState("");

  // get application object from uid
  const applicationsRef = firebase.firestore().collection('assignments');
  const docRef = applicationsRef.doc(uid);

  function handleSave(event: any) {
    setDoc(docRef, {
      name: studentName,
      email: studentEmail,
      ufid: studentId,
      supervisor_ufid: facultyId,
      start_date: startDate,
      end_date: endDate,
      date: docData.date,
      class_codes: docData.class_codes,
      degree: docData.degree,
      department: docData.department,
      hours: Array.isArray(hours) ? hours : docData.hours,
      position: docData.position,
      semesters: docData.semesters,
      student_uid: docData.student_uid,
      title: title,
      percentage: percentage,
      annual_rate: annualRate,
      biweekly_rate: biweeklyRate,
      target_amount: targetAmt,
      remote: remote,
    })
  }

  React.useEffect(() => {
    docRef
      .get()
      .then((doc) => {
        if (doc.exists) {
          setDocData(doc.data());
          console.log(doc.data());

          setStudentName(doc.data().name);
          setStudentEmail(doc.data().email);
          setHours(doc.data().hours[0]);
          if (doc.data().ufid === undefined) {
            setStudentId("");
          } else {
            setStudentId(doc.data().ufid);
          }

          if (doc.data().supervisor_ufid === undefined) {
            setFacultyId("");
          } else {
            setFacultyId(doc.data().supervisor_ufid);
          }

          if (doc.data().start_date === undefined) {
            setStartDate("");
          } else {
            setStartDate(doc.data().start_date);
          }


          if (doc.data().end_date === undefined) {
            setEndDate("");
          } else {
            setEndDate(doc.data().end_date);
          }

          if (doc.data().title === undefined) {
            setTitle("");
          } else {
            setTitle(doc.data().title);
          }

          if (doc.data().percentage === undefined) {
            setPercentage("");
          } else {
            setPercentage(doc.data().percentage);
          }

          if (doc.data().annual_rate === undefined) {
            setAnnualRate("");
          } else {
            setAnnualRate(doc.data().annual_rate);
          }

          if (doc.data().biweekly_rate === undefined) {
            setBiweeklyRate("");
          } else {
            setBiweeklyRate(doc.data().biweekly_rate);
          }

          if (doc.data().target_amount === undefined) {
            setTargetAmt("");
          } else {
            setTargetAmt(doc.data().target_amount);
          }

          if (doc.data().remote === undefined) {
            setRemote("No");
          } else {
            setRemote(doc.data().remote);
          }
          console.log(studentName);

        } else {
          console.log('No such document!');
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error);
      });
  }, [uid]); // Only re-run the effect if uid changes

  return (
    <Box sx={{ minWidth: '1000px', maxWidth: '1000px', borderRadius: 4 }}>
      {docData && (
        <Grid sx={{ flexGrow: 1 }} spacing={4}>
          <Grid item xs={22}>
            <Grid container justifyContent="left" spacing={4}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((value) => {
                if (value == 0) {
                  return (
                    <Grid key={value} item>
                      <Paper
                        elevation={3}
                        sx={{
                          height: 220,
                          width: 300,
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
                          borderRadius: 4,
                        }}
                      >
                        <Typography
                          variant="h6"
                          paddingTop="10px"
                          fontWeight="bold"
                          marginLeft="20px"
                          marginBottom="10px"
                        >
                          Student Information:
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Name: {docData.name}
                        </Typography>


                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Email: {docData.email}
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          UFID: {studentId}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                } else if (value == 1) {
                  return (
                    <Grid key={value} item>
                      <Paper
                        elevation={3}
                        sx={{
                          height: 220,
                          width: 300,
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
                          borderRadius: 4,
                        }}
                      >
                        <Typography
                          variant="h6"
                          paddingTop="10px"
                          fontWeight="bold"
                          marginLeft="20px"
                          marginBottom="10px"
                        >
                          Supervisor Information:
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Supervisor Name: {docData.class_codes.split(' ')[4]}
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Supervisor Email:  -----------
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          UFID: {facultyId}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                } else if (value == 2) {
                  return (
                    <Grid key={value} item>
                      <Paper
                        elevation={3}
                        sx={{
                          height: 220,
                          width: 300,
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
                          borderRadius: 4,
                        }}
                      >
                        <Typography
                          variant="h6"
                          paddingTop="10px"
                          fontWeight="bold"
                          marginLeft="20px"
                          marginBottom="10px"
                        >
                          Proxy Information:
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Proxy Name: Christophe Bobda
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Proxy Email: cbobda@ufl.edu
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          UFID: ------
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                } else if (value == 3) {
                  return (
                    <Grid key={value} item>
                      <Paper
                        elevation={3}
                        sx={{
                          height: 220,
                          width: 300,
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
                          borderRadius: 4,
                        }}
                      >
                        <Typography
                          variant="h6"
                          paddingTop="10px"
                          fontWeight="bold"
                          marginLeft="20px"
                          marginBottom="10px"
                        >
                          Application Details:
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Requested Action: NEW HIRE
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Position Type: TA
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Degree Type: BS
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Available Hours: {docData.hours[0]}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                } else if (value == 4) {
                  return (
                    <Grid key={value} item>
                      <Paper
                        elevation={3}
                        sx={{
                          height: 220,
                          width: 300,
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
                          borderRadius: 4,
                        }}
                      >
                        <Typography
                          variant="h6"
                          paddingTop="10px"
                          fontWeight="bold"
                          marginLeft="20px"
                          marginBottom="10px"
                        >
                          Employment Duration:
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Semester: {docData.semesters}
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Starting Date: {startDate}
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          End Date:{endDate}
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          FTE: 15 Hours
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                } else if (value == 5) {
                  return (
                    <Grid key={value} item>
                      <Paper
                        elevation={3}
                        sx={{
                          height: 220,
                          width: 300,
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
                          borderRadius: 4,
                        }}
                      >
                        <Typography
                          variant="h6"
                          paddingTop="10px"
                          fontWeight="bold"
                          marginLeft="20px"
                          marginBottom="10px"
                        >
                          Employment Details:
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Working Title: {title}
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Duties: UPI in {docData.class_codes}
                        </Typography>
                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Remote: {remote}
                        </Typography>



                      </Paper>
                    </Grid>
                  );
                } else if (value == 6) {
                  return (
                    <Grid key={value} item>
                      <Paper
                        elevation={3}
                        sx={{
                          height: 220,
                          width: 300,
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
                          borderRadius: 4,
                        }}
                      >
                        <Typography
                          variant="h6"
                          paddingTop="10px"
                          fontWeight="bold"
                          marginLeft="20px"
                          marginBottom="10px"
                        >
                          Project Details:
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Project ID: 000108927
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Project Name: DEPARTMENT TA/UPIS
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Percentage: {percentage}
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Hours: {docData.hours[0]}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                } else if (value == 7) {
                  return (
                    <Grid key={value} item>
                      <Paper
                        elevation={3}
                        sx={{
                          height: 220,
                          width: 300,
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
                          borderRadius: 4,
                        }}
                      >
                        <Typography
                          variant="h6"
                          paddingTop="10px"
                          fontWeight="bold"
                          marginLeft="20px"
                          marginBottom="10px"
                        >
                          Financial Details:
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Annual Rate: {annualRate}
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Biweekly Rate: {biweeklyRate}
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Hourly Rate: 15
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Target Amount: {targetAmt}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                } else {
                  return (
                    <Grid key={value} item>

                      {/* <Paper */}
                      {/*   elevation={3} */}
                      {/*   sx={{ */}
                      {/*     height: 220, */}
                      {/*     width: 300, */}
                      {/*     backgroundColor: (theme) => */}
                      {/*       theme.palette.mode === 'dark' ? '#1A2027' : '#fff', */}
                      {/*     borderRadius: 4, */}
                      {/*   }} */}
                      {/* /> */}
                    </Grid>
                  );
                }
              })}
            </Grid>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
