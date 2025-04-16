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
  Container,
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
    <Container 
      maxWidth="xl"
      sx={{
        marginTop: "380px",
        paddingBottom: "80px",
        px: { xs: '4%', sm: '6%', md: '8%' }  // Responsive horizontal padding
      }}
    >
      
      <Typography variant="h4" sx={{ mt: 2, mb: 3 }}>Research</Typography>
      
      {/* Filter Controls */}
      <Box 
        sx={{
          display: 'flex',
          flexDirection: 'row', // Always keep row direction
          flexWrap: 'wrap', // Allow wrapping to next line
          alignItems: 'center',
          gap: 2,
          mb: 4
        }}
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
            minWidth: { xs: '100%', sm: '300px' }, // Full width on xs, min-width on sm+
            flexGrow: { sm: 1 }, // Only grow on sm and above
            mb: { xs: 1, sm: 0 } // Add bottom margin on xs only
          }}
        />
        <Button
          variant="outlined"
          onClick={() => getResearchListings()}
          sx={{ height: '40px' }}
        >
          Clear
        </Button>
        
        <FormControl size="small" sx={{ minWidth: '130px', flexShrink: 0 }}>
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
        
        <FormControl size="small" sx={{ minWidth: '150px', flexShrink: 0 }}>
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
        
        <FormControl size="small" sx={{ minWidth: '180px', flexShrink: 0 }}>
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
        
        <Button
          sx={{
            backgroundColor: '#5A41D8',
            color: '#FFFFFF',
            textTransform: 'none',
            borderRadius: '8px',
            boxShadow: '0px 0px 8px #E5F0DC',
            fontWeight: 500,
            marginLeft: { md: 'auto' }, // Push to right on md and larger screens
            '&:hover': {
              backgroundColor: '#5A41D8',
              boxShadow: '0px 0px 8px #E5F0DC',
            },
          }}
          onClick={() => showMyApplications(!myApplications)}
        >
          {myApplications ? 'Show My Applications' : 'Switch to Default View'}
        </Button>
      </Box>

      {/* Cards Grid */}
      <Grid container spacing={3}>
        {myApplications
          ? researchListings.map((item, index) => (
              <Grid item xs={12} md={6} lg={6} key={index}>
                <ProjectCard
                  listingId={item.id}
                  userRole={role}
                  project_title={item.project_title}
                  department={item.department}
                  faculty_mentor={item.faculty_mentor}
                  terms_available={Object.keys(item.terms_available)
                    .filter(
                      (key) =>
                        item.terms_available[
                          key as keyof typeof item.terms_available
                        ]
                    )
                    .join(', ')}
                  student_level={Object.keys(item.student_level)
                    .filter(
                      (key) =>
                        item.student_level[
                          key as keyof typeof item.student_level
                        ]
                    )
                    .join(', ')}
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
            ))
          : researchApplications.map((item, index) => (
              <Grid item xs={12} md={6} lg={6} key={index}>
                <ApplicationCard
                  userRole={role}
                  project_title={`Application ID: ${item.appid}`}
                  department={item.department || 'N/A'}
                  faculty_mentor={
                    `${item.first_name} ${item.last_name}`.trim() || 'N/A'
                  }
                  terms_available={
                    item.terms_available
                      ? Object.keys(item.terms_available)
                          .filter(
                            (key) =>
                              item.terms_available[
                                key as keyof typeof item.terms_available
                              ]
                          )
                          .join(', ')
                      : 'N/A'
                  }
                  student_level={item.degree || 'N/A'}
                  project_description={
                    item.qualifications || 'No description provided'
                  }
                  phd_student_mentor="N/A"
                  prerequisites="N/A"
                  credit="N/A"
                  stipend="N/A"
                  application_requirements="N/A"
                  application_deadline={item.date_applied || 'N/A'}
                  website="N/A"
                />
              </Grid>
            ))}
      </Grid>
    </Container>
  );
};

export default StudentResearchView;
