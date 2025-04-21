import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Grid,
} from '@mui/material';
import ProjectCard from '@/components/Research/ProjectCard';
import ApplicationCard from '@/components/Research/ApplicationCard';

interface StudentResearchViewProps {
  researchListings: any[];
  researchApplications: any[];
  role: string;
  uid: string;
  department: string;
  setDepartment: (value: string) => void;
  studentLevel: string;
  setStudentLevel: (value: string) => void;
  termsAvailable: string;
  setTermsAvailable: (value: string) => void;
  getResearchListings: () => void;
  setResearchListings: (listings: any[]) => void;
  getApplications: () => void;
  setResearchApplications: (Applications: any[]) => void;
}

const StudentResearchView: React.FC<StudentResearchViewProps> = ({
  researchListings,
  researchApplications,
  role,
  uid,
  department,
  setDepartment,
  studentLevel,
  setStudentLevel,
  termsAvailable,
  setTermsAvailable,
  getResearchListings,
  setResearchListings,
  getApplications,
  setResearchApplications,
}) => {
  const [myApplications, showMyApplications] = useState(true);

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Research
        </Typography>
        <Box
          marginTop="380px"
          justifyContent="space-between"
          display="flex"
          flexWrap="wrap"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            marginBottom="16px"
          >
            <TextField
              label="Search Positions"
              variant="outlined"
              size="small"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const searchText = (
                    e.target as HTMLInputElement
                  ).value.toLowerCase();
                  const filteredListings = researchListings.filter((item) =>
                    item.project_title.toLowerCase().includes(searchText)
                  );
                  setResearchListings(filteredListings);
                }
              }}
              sx={{
                flex: 1,
                marginLeft: '96px',
                marginRight: '16px',
                width: '600px',
              }}
            />
            <Button
              variant="outlined"
              onClick={() => getResearchListings()}
              sx={{ marginRight: '16px', height: '40px' }}
            >
              Clear
            </Button>
            <FormControl
              size="small"
              sx={{ minWidth: 150, marginRight: '16px' }}
            >
              <InputLabel>Department</InputLabel>
              <Select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Computer Science">Computer Science</MenuItem>
                <MenuItem value="Biology">Biology</MenuItem>
                <MenuItem value="Physics">Physics</MenuItem>
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{ minWidth: 150, marginRight: '16px' }}
            >
              <InputLabel>Student Level</InputLabel>
              <Select
                value={studentLevel}
                onChange={(e) => setStudentLevel(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="freshman">Freshman</MenuItem>
                <MenuItem value="sophomore">Sophomore</MenuItem>
                <MenuItem value="junior">Junior</MenuItem>
                <MenuItem value="senior">Senior</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Terms Available</InputLabel>
              <Select
                value={termsAvailable}
                onChange={(e) => setTermsAvailable(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="spring">Spring</MenuItem>
                <MenuItem value="summer">Summer</MenuItem>
                <MenuItem value="fall">Fall</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Center: "Research Board View" Button */}
          <Button
            sx={{
              backgroundColor: '#5A41D8', // Same purple as Edit Application
              color: '#FFFFFF', // White text
              textTransform: 'none', // Keep text normal case
              borderRadius: '8px', // Rounded corners
              boxShadow: '0px 0px 8px #E5F0DC', // Subtle greenish glow
              fontWeight: 500,
              padding: '10px 24px',
              marginBottom: '16px', // Add vertical space below the button
              '&:hover': {
                backgroundColor: '#5A41D8', // Keep hover consistent
                boxShadow: '0px 0px 8px #E5F0DC',
              },
            }}
            onClick={() => showMyApplications(!myApplications)}
          >
            {myApplications ? 'Show My Applications' : 'Switch to Default View'}
          </Button>

          {/* Conditional rendering based on state */}
          {myApplications ? (
            <Grid container spacing={4} mt={3} mx="5%">
              {researchListings.map((item, index) => (
                <Grid item xs={12} sm={6} md={6} key={index}>
                  <ProjectCard
                    listingId={item.id}
                    userRole={role}
                    project_title={item.project_title}
                    department={item.department}
                    faculty_mentor={item.faculty_mentor}
                    terms_available={item.terms_available}
                    student_level={item.student_level}
                    project_description={item.project_description}
                    phd_student_mentor={item.phd_student_mentor}
                    prerequisites={item.prerequisites}
                    credit={item.credit}
                    stipend={item.stipend}
                    application_requirements={item.application_requirements}
                    application_deadline={item.application_deadline}
                    website={item.website}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={4} mt={3} mx="5%">
              {researchApplications.map((item, index) => (
                <Grid item xs={12} sm={6} md={6} key={index}>
                  <ApplicationCard
                    userRole={role}
                    project_title={`Application ID: ${item.appid}`} // Displaying appid as the title
                    department={item.department || 'N/A'} // Fallback to 'N/A' if department is missing
                    faculty_mentor={
                      `${item.first_name} ${item.last_name}`.trim() || 'N/A'
                    } // Combining first and last name
                    terms_available={item.terms_available}
                    student_level={item.degree || 'N/A'} // Mapping degree to student level
                    project_description={
                      item.qualifications || 'No description provided'
                    } // Using qualifications as description
                    phd_student_mentor="N/A" // Placeholder if no mentor info is available
                    prerequisites="N/A" // Placeholder if no prerequisites info is available
                    credit="N/A" // Placeholder if no credit info is available
                    stipend="N/A" // Placeholder if no stipend info is available
                    application_requirements="N/A" // Placeholder if no requirements info is available
                    application_deadline={item.date_applied || 'N/A'} // Using date_applied as a deadline
                    website="N/A" // Placeholder if no website info is available
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </>
  );
};

export default StudentResearchView;
