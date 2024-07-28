import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { Grid } from '@mui/material';
import Paper from '@mui/material/Paper';

export interface AppViewProps {
  uid: string;
}

export default function AppView({ uid }: AppViewProps) {
  const [docData, setDocData] = React.useState<any>(null);

  // get application object from uid
  const applicationsRef = firebase.firestore().collection('assignments');
  const docRef = applicationsRef.doc(uid);

  React.useEffect(() => {
    docRef
      .get()
      .then((doc) => {
        if (doc.exists) {
          setDocData(doc.data());
        } else {
          console.log('No such document!');
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error);
      });
  }, [uid, docRef]); // Only re-run the effect if uid changes
  console.log(docData);

  return (
    <Box sx={{ minWidth: '1000px', maxWidth: '1000px', borderRadius: 4 }}>
      {docData && (
        <Grid sx={{ flexGrow: 1 }} spacing={4}>
          <Grid item xs={22}>
            <Grid container justifyContent="left" spacing={4}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((value) => {
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
                          Student Name: {docData.name}
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
                          Student UFID: ------
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
                          Supervisor Email: ----------
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Supervisor UFID: ------
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
                          Proxy Name: ----------
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Proxy Email: ----------
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Proxy UFID: ------
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
                          Available Hours: {docData.hours}
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
                          Starting Date: ---------
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          End Date: ----------
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
                          Working Title: -----------
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
                          FTE: 15 Hours
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Imported: YES
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
                          Percentage: -------------
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Hours: 15
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
                          Annual Rate: ----------
                        </Typography>

                        <Typography
                          marginLeft="20px"
                          marginBottom="10px"
                          fontSize="15px"
                        >
                          Biweekly Rate: -----------
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
                          Target Amount: -----------
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                } else {
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
                      />
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
