import React, { useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Avatar,
  IconButton,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import ApplicationTile from './ApplicationTile';
import firebase from '@/firebase/firebase_config';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  where,
  query,
  documentId,
  getDocs,
} from 'firebase/firestore';

interface FacultyApplicantsViewProps {
  id: string;
  researchListing: any;
  onBack: () => void;
}

const FacultyApplicantsView: React.FC<FacultyApplicantsViewProps> = ({
  id,
  researchListing,
  onBack,
}) => {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [applications, setApplications] = React.useState<any[]>(
    researchListing.applications
  );

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const changeStatus = async (id: string, app_status: string) => {
    const db = firebase.firestore();
    const docRef = doc(db, 'research-listings', researchListing.docID);
    const colRef = collection(docRef, 'applications');
    const docAppRef = doc(colRef, id);
    await updateDoc(docAppRef, { app_status });
    for (var i = 0; i < researchListing.applications.length; i++) {
      setApplications((old) =>
        old.map((app) => (app.id === id ? { ...app, app_status } : app))
      );
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ width: '100%', p: 4 }}>
        {/* Top header area with button now aligned */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center', // Changed from 'baseline' to 'center' for better vertical alignment
            mb: 3, // Increased bottom margin for more space
            width: '100%',
          }}
        >
          <Typography variant="h5">
            {researchListing.project_title}
          </Typography>

          <Button
            onClick={onBack}
            variant="outlined"
            sx={{
              borderColor: '#5A41D8',
              color: '#5A41D8',
              '&:hover': {
                borderColor: '#4A35B8',
                backgroundColor: 'rgba(90, 65, 216, 0.04)',
              },
            }}
          >
            Back to Research Listings
          </Button>
        </Box>

        {/* Tabs for Needs Review, Approved, Denied */}
        <Box sx={{ justifyContent: 'center', display: 'flex' }}>
          <Box sx={{ width: '50%' }}>
            <Tabs
              value={tabIndex}
              onChange={handleChange}
              variant="fullWidth"
              TabIndicatorProps={{ style: { display: 'none' } }}
              sx={{
                border: '1px solid #555',
                borderRadius: '9999px',
                minHeight: 'auto',
                '& .Mui-selected': {
                  backgroundColor: '#673AB7',
                  color: '#fff',
                },
              }}
            >
              <Tab label="Needs Review" />
              <Tab label="Approved" />
              <Tab label="Denied" />
            </Tabs>
          </Box>
        </Box>

        {/* Section title */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          Applications
        </Typography>

        {/* Application tiles based on tabs */}
        {tabIndex === 0 &&
          applications
            .filter((item) => item.app_status === 'Pending')
            .map((item, index) => (
              <ApplicationTile
                key={index}
                changeStatus={changeStatus}
                item={item}
                status={'Pending'}
              />
            ))}
        {tabIndex === 1 &&
          applications
            .filter((item) => item.app_status === 'Approved')
            .map((item, index) => (
              <ApplicationTile
                key={index}
                changeStatus={changeStatus}
                item={item}
                status={'Approved'}
              />
            ))}
        {tabIndex === 2 &&
          applications
            .filter((item) => item.app_status === 'Denied')
            .map((item, index) => (
              <ApplicationTile
                key={index}
                changeStatus={changeStatus}
                item={item}
                status={'Denied'}
              />
            ))}
      </Box>
    </Box>
  );
};

export default FacultyApplicantsView;
