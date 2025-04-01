import React from 'react';
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

interface StudentResearchViewProps {
  researchListings: any[];
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
}

const StudentResearchView: React.FC<StudentResearchViewProps> = ({
  researchListings,
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
}) => {
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
          <Grid container spacing={4} mt={3} mx="5%">
            {researchListings.map((item, index) => (
              <Grid item xs={12} sm={6} md={6} key={index}>
                <ProjectCard
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
            ))}
          </Grid>
        </Box>
      </Box>
    </>
  );
};

export default StudentResearchView;
