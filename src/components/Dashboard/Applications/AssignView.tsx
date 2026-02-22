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
  const [studentName, setStudentName] = React.useState('');
  const [studentEmail, setStudentEmail] = React.useState('');
  const [studentId, setStudentId] = React.useState('');
  const [facultyId, setFacultyId] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [hours, setHours] = React.useState<any>(null);
  const [title, setTitle] = React.useState('');
  const [percentage, setPercentage] = React.useState('');
  const [annualRate, setAnnualRate] = React.useState('');
  const [biweeklyRate, setBiweeklyRate] = React.useState('');
  const [targetAmt, setTargetAmt] = React.useState('');
  const [remote, setRemote] = React.useState('');

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
    });
  }

  React.useEffect(() => {
    docRef
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data()!;
          setDocData(data);
          console.log(data);

          setStudentName(data.name);
          setStudentEmail(data.email);
          setHours(data.hours[0]);
          if (data.ufid === undefined) {
            setStudentId('');
          } else {
            setStudentId(data.ufid);
          }

          if (data.supervisor_ufid === undefined) {
            setFacultyId('');
          } else {
            setFacultyId(data.supervisor_ufid);
          }

          if (data.start_date === undefined) {
            setStartDate('');
          } else {
            setStartDate(data.start_date);
          }

          if (data.end_date === undefined) {
            setEndDate('');
          } else {
            setEndDate(data.end_date);
          }

          if (data.title === undefined) {
            setTitle('');
          } else {
            setTitle(data.title);
          }

          if (data.percentage === undefined) {
            setPercentage('');
          } else {
            setPercentage(data.percentage);
          }

          if (data.annual_rate === undefined) {
            setAnnualRate('');
          } else {
            setAnnualRate(data.annual_rate);
          }

          if (data.biweekly_rate === undefined) {
            setBiweeklyRate('');
          } else {
            setBiweeklyRate(data.biweekly_rate);
          }

          if (data.target_amount === undefined) {
            setTargetAmt('');
          } else {
            setTargetAmt(data.target_amount);
          }

          if (data.remote === undefined) {
            setRemote('No');
          } else {
            setRemote(data.remote);
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
                          Name:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '20ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={docData.name}
                            onChange={(event) => {
                              setStudentName(event.target.value);
                            }}
                          />
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Email:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '20ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={docData.email}
                            onChange={(event) => {
                              setStudentEmail(event.target.value);
                            }}
                          />
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          UFID:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '20ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={studentId}
                            onChange={(event) => {
                              setStudentId(event.target.value);
                            }}
                          />
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
                          Supervisor Email: -----------
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          UFID:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '20ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={facultyId}
                            onChange={(event) => {
                              setFacultyId(event.target.value);
                            }}
                          />
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
                          Starting Date:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '15ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={startDate}
                            onChange={(event) => {
                              setStartDate(event.target.value);
                            }}
                          />
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          End Date:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '15ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={endDate}
                            onChange={(event) => {
                              setEndDate(event.target.value);
                            }}
                          />
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
                          Working Title:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '15ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={title}
                            onChange={(event) => {
                              setTitle(event.target.value);
                            }}
                          />
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
                          Remote:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '15ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={remote}
                            onChange={(event) => {
                              setRemote(event.target.value);
                            }}
                          />
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
                          Percentage:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '15ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={percentage}
                            onChange={(event) => {
                              setPercentage(event.target.value);
                            }}
                          />
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Hours:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '15ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={docData.hours[0]}
                            onChange={(event) => {
                              setHours([event.target.value]);
                            }}
                          />
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
                          Annual Rate:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '15ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={annualRate}
                            onChange={(event) => {
                              setAnnualRate(event.target.value);
                            }}
                          />
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Biweekly Rate:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '15ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={biweeklyRate}
                            onChange={(event) => {
                              setBiweeklyRate(event.target.value);
                            }}
                          />{' '}
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
                          Target Amount:{' '}
                          <TextField
                            size="small"
                            sx={{
                              width: '15ch',
                              '& .MuiInputBase-input': {
                                fontSize: '12px', // Adjust the font size for the input text
                              },
                            }}
                            defaultValue={targetAmt}
                            onChange={(event) => {
                              setTargetAmt(event.target.value);
                            }}
                          />
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                } else {
                  return (
                    <Grid key={value} item>
                      <Button
                        variant="contained"
                        size="large"
                        sx={{ top: 180, left: 180 }}
                        onClick={handleSave}
                      >
                        Save Edits
                      </Button>

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
