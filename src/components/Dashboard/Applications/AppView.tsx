import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

export interface AppViewProps {
  uid: string;
}

export default function AppView({ uid }: AppViewProps) {
  const [docData, setDocData] = React.useState<any>(null);

  // get application object from uid
  const applicationsRef = firebase.firestore().collection('applications');
  const docRef = applicationsRef.doc(uid);

  React.useEffect(() => {
    docRef
      .get()
      .then((doc) => {
        if (doc.exists) {
          console.log(doc.data());

          setDocData(doc.data());
        } else {
          console.log('No such document!');
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error);
      });
  }, [uid, docRef]); // Only re-run the effect if uid changes
  return (
    <Box sx={{ minWidth: 120 }}>
      {docData && (
        <>
          <Typography variant="h6">Timestamp:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.date}
          </Typography>

          <Typography variant="h6">First Name:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.firstname}
          </Typography>

          <Typography variant="h6">Last Name:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.lastname}
          </Typography>

          <Typography variant="h6">UF Email:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.email}
          </Typography>

          <Typography variant="h6">Phone:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.phonenumber}
          </Typography>

          <Typography variant="h6">Department:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.department}
          </Typography>

          <Typography variant="h6">Degree:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.degree}
          </Typography>

          <Typography variant="h6">Upcoming Semester Status:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.semesterstatus}
          </Typography>


          <Typography variant="h6">Position:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.position}
          </Typography>

          <Typography variant="h6">Semesters:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.available_semesters}
          </Typography>

          <Typography variant="h6">Availability:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.available_hours}
          </Typography>

          <Typography variant="h6">Courses:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {Object.entries(docData.courses).filter(([key, value]) => (value == "accepted")).map(([key, value]) => (key))
            }
          </Typography>

          <Typography variant="h6">Qualifications:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.qualifications}
          </Typography>

          <Typography variant="h6">Graduate Plans:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.additionalprompt}
          </Typography>

          {docData.fee_waiver ? (
            <Typography variant="h6">Fee Waiver:</Typography>
          ) : null}
          {docData.fee_waiver ? (
            <Typography variant="body1" style={{ marginBottom: '10px' }}>
              {docData.fee_waiver}
            </Typography>
          ) : null}

          <Typography variant="h6">Resume Link:</Typography>
          {docData.resume_link ? (
            <Typography variant="body1" style={{ marginBottom: '10px' }}>
              {' '}
              <a
                href={docData.resume_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {docData.resume_link}
              </a>
            </Typography>
          ) : (
            <Typography variant="body1" style={{ marginBottom: '10px' }}>
              No resume link provided.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
