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
} from "@mui/material";
import ApplicationTile from './ApplicationTile';
import firebase from '@/firebase/firebase_config';
import { collection, addDoc, updateDoc, doc, where, query, documentId, getDocs } from 'firebase/firestore';


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
  const [applications, setApplications] = React.useState<any[]>(researchListing.applications);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const changeStatus = async (id: string, app_status: string) => {
    const db = firebase.firestore();
    const docRef = doc(db, 'research-listings', researchListing.docID);
    const colRef = collection(docRef, "applications")
    const docAppRef = doc(colRef, id)
    await updateDoc(docAppRef, { app_status });
    for (var i = 0;i < researchListing.applications.length; i++) {
      setApplications(old =>
        old.map(app =>
          app.id === id
            ? { ...app, app_status }  
            : app                     
        ))
    }
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Button onClick={onBack} variant="outlined" sx={{ mb: 2 }}>
        Back to Research Listings
      </Button>
      <Box sx={{ width: "100%", p: 4 }}>
        {/* Top header area */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            mb: 2,
          }}
        >
          <Typography variant="h5">Modeling Dialogue for Supporting Learning</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Fall 2023
          </Typography>
        </Box>

        {/* Tabs for Needs Review, Approved, Denied */}
        <Box sx={{ justifyContent: "center", display: 'flex' }}>
          <Box sx={{ width: "50%" }}>
            <Tabs
              value={tabIndex}
              onChange={handleChange}
              // Spread the tabs evenly
              variant="fullWidth"
              // Hide the default selection indicator bar
              TabIndicatorProps={{ style: { display: "none" } }}
              sx={{
                // Outer container styles
                border: "1px solid #555",       // Change to desired border color
                borderRadius: "9999px",         // Large border-radius for "pill" shape
                minHeight: "auto",              // Allow more control over tab height
                // Selected tab styles
                "& .Mui-selected": {
                  backgroundColor: "#673AB7",   // Purple fill for selected tab
                  color: "#fff",                // White text for selected tab
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
        <Typography variant="h6" sx={{ mb: 2 }}>
          Research
        </Typography>

        {tabIndex === 0 &&
          applications.filter(item => item.app_status === 'Pending').map((item) => <ApplicationTile changeStatus={changeStatus} item={item} status={"Pending"} />)}
        {tabIndex === 1 &&
          applications.filter(item => item.app_status === 'Approved').map((item) => <ApplicationTile changeStatus={changeStatus} item={item} status={"Approved"} />)}
        {tabIndex === 2 &&
          applications.filter(item => item.app_status === 'Denied').map((item) => <ApplicationTile changeStatus={changeStatus} item={item} status={"Denied"} />)}
      </Box>
    </Box>
  );
};


export default FacultyApplicantsView;
