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
    <Box sx={{ minWidth: 120 }}>
      {docData && (
        <>
          <Typography variant="h6">Name:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.name}
          </Typography>

          <Typography variant="h6">Class Codes:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.class_codes}
          </Typography>
          <Typography variant="h6">Hours of Availability:</Typography>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            {docData.hours}
          </Typography>

        </>
      )}
    </Box>
  );
}
