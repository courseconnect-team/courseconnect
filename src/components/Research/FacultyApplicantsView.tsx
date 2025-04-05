import React from 'react';
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

interface UserItem {
  name: string;
  email: string;
}

interface FacultyApplicantsViewProps {
  id: string;
  name: string;
  researchApplications: any[];
  onBack: () => void;
}

const FacultyApplicantsView: React.FC<FacultyApplicantsViewProps> = ({
  id,
  name,
  researchApplications,
  onBack,
}) => {
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };
  // Mock data for applicants (replace with actual data fetching logic)
  const needsReviewData: UserItem[] = [
    { name: "Firstname Lastname", email: "emailaddress@ufl.edu" },
    { name: "Firstname Lastname", email: "emailaddress@ufl.edu" },
    { name: "Firstname Lastname", email: "emailaddress@ufl.edu" },
  ];

  const approvedData: UserItem[] = [
    { name: "Firstname Lastname", email: "emailaddress@ufl.edu" },
    { name: "Firstname Lastname", email: "emailaddress@ufl.edu" },
    { name: "Firstname Lastname", email: "emailaddress@ufl.edu" },
  ];

  const deniedData: UserItem[] = [
    { name: "Firstname Lastname", email: "emailaddress@ufl.edu" },
    { name: "Firstname Lastname", email: "emailaddress@ufl.edu" },
    { name: "Firstname Lastname", email: "emailaddress@ufl.edu" },
  ];

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
        <Box sx={{justifyContent:"center", display: 'flex'}}>
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

        {/* Render different content based on selected tab */}
        {tabIndex === 0 &&
          needsReviewData.map((item) => <ApplicationTile item={item} status={"needs"} />)}
        {tabIndex === 1 &&
          approvedData.map((item) => <ApplicationTile item={item} status={"approved"} />)}
        {tabIndex === 2 &&
          deniedData.map((item) => <ApplicationTile item={item} status={"denied"} />)}
      </Box>
    </Box>
  );
};


export default FacultyApplicantsView;
