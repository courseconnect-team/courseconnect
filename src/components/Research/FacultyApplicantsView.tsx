import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';

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
  // Mock data for applicants (replace with actual data fetching logic)
  const applicants = [
    { id: '1', name: 'John Doe', status: 'Pending' },
    { id: '2', name: 'Jane Smith', status: 'Approved' },
    { id: '3', name: 'Alice Johnson', status: 'Denied' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={onBack} variant="outlined" sx={{ mb: 2 }}>
        Back to Research Listings
      </Button>
      <Typography variant="h5" gutterBottom>
        Project Title: {name}
      </Typography>
      <Typography variant="h4" gutterBottom>
        Applicants for Research ID: {id}
      </Typography>
      <Grid container spacing={2}>
        {applicants.map((applicant) => (
          <Grid item xs={12} sm={6} md={4} key={applicant.id}>
            <Box
              sx={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                p: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6">{applicant.name}</Typography>
              <Typography>Status: {applicant.status}</Typography>
              <Button variant="contained" sx={{ mt: 1, mr: 1 }}>
                Approve
              </Button>
              <Button variant="contained" color="error" sx={{ mt: 1 }}>
                Deny
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FacultyApplicantsView;
