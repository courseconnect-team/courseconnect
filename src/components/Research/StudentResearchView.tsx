import React, { useEffect, useState, useRef } from 'react';
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
  setStudentLevel,
  setTermsAvailable,
  getResearchListings,
  setResearchListings,
  getApplications,
}) => {
  const [myApplications, showMyApplications] = useState(true);
  const [originalListings, setOriginalListings] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (researchListings.length > 0 && originalListings.length === 0) {
      setOriginalListings([...researchListings]);
    }
  }, [researchListings, originalListings.length]);

  useEffect(() => {
    getApplications();
  }, []);

  const handleSearch = (searchText: string) => {
    if (!searchText && department === "") {
      setResearchListings([...originalListings]);
      return;
    }

    const listingsToFilter = originalListings.length > 0 ? 
      [...originalListings] : 
      [...researchListings];

    let filteredListings = listingsToFilter;
    
    // Text search
    if (searchText) {
      filteredListings = filteredListings.filter(item => {
        const searchLower = searchText.toLowerCase();
        
        const titleMatch = item.project_title && 
          typeof item.project_title === 'string' && 
          item.project_title.toLowerCase().includes(searchLower);
          
        const descriptionMatch = item.project_description && 
          typeof item.project_description === 'string' && 
          item.project_description.toLowerCase().includes(searchLower);
          
        const mentorMatch = item.faculty_mentor && 
          typeof item.faculty_mentor === 'string' && 
          item.faculty_mentor.toLowerCase().includes(searchLower);
          
        return titleMatch || descriptionMatch || mentorMatch;
      });
      console.log("Filtered Listings: ", filteredListings);
    }

    // Department filter with special handling for CISE
    if (department) {
      filteredListings = filteredListings.filter(item => {
        if (department === "Computer and Information Science and Engineering") {
          return (
            item.department === "Computer and Information Science and Engineering" ||
            item.department === "Computer and Information Sciences and Engineering" ||
            (item.department && item.department.toLowerCase().includes("computer") && 
             item.department.toLowerCase().includes("information") && 
             item.department.toLowerCase().includes("engineering"))
          );
        }
        return item.department === department;
      });
      console.log("Filtered Listings by Department: ", filteredListings);
    }

    setResearchListings(filteredListings);
  };

  const handleClearFilters = () => {
    setDepartment("");
    setStudentLevel("");
    setTermsAvailable("");

    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }

    if (originalListings.length > 0) {
      setResearchListings([...originalListings]);
    } else {
      getResearchListings();
    }
  };

  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    const searchText = searchInputRef.current?.value || "";
    handleSearch(searchText);
  };

  return (
    <Container 
      sx={{ 
        mt: "380px",
        mb: 8,
        maxWidth: {
          xs: '100%',
          sm: '95%',
          md: '90%', 
          lg: '85%',
          xl: '80%',
        },
        mx: 'auto',
      }}
    >
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
      >
        <Typography variant="h4">
          Research
        </Typography>
        
        <Button
          sx={{
            backgroundColor: '#5A41D8',
            color: '#FFFFFF',
            textTransform: 'none',
            borderRadius: '8px',
            boxShadow: '0px 0px 8px #E5F0DC',
            fontWeight: 500,
            padding: '10px 24px',
            '&:hover': {
              backgroundColor: '#4A35B8',
              boxShadow: '0px 0px 12px #E5F0DC',
            },
          }}
          onClick={() => showMyApplications(!myApplications)}
        >
          {myApplications ? 'Show My Applications' : 'Switch to Default View'}
        </Button>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        {/* Only show search controls when viewing research listings (not applications) */}
        {myApplications ? (
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
            mb={3}
          >
            <TextField
              label="Search Positions"
              variant="outlined"
              size="small"
              inputRef={searchInputRef}
              onChange={(e) => {
                if (e.target.value === '') {
                  handleSearch('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const searchText = (e.target as HTMLInputElement).value;
                  handleSearch(searchText);
                }
              }}
              sx={{ flex: 1 }}
            />
            
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              sx={{ 
                height: '40px',
                minWidth: '80px',
                borderColor: '#5A41D8',
                color: '#5A41D8',
                '&:hover': {
                  borderColor: '#4A35B8',
                  backgroundColor: 'rgba(90, 65, 216, 0.04)',
                },
              }}
            >
              Clear
            </Button>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value as string)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={"Computer and Information Science and Engineering"}>CISE</MenuItem>
                <MenuItem value="Electrical and Computer Engineering">ECE</MenuItem>
                <MenuItem value="Engineering Education">Education</MenuItem>
              </Select>
            </FormControl>
          </Box>
        ) : null}

        {/* Content Display remains the same */}
        {myApplications ? (
          <Grid container spacing={4}>
            {researchListings.map((item, index) => (
              <Grid item xs={12} md={12} lg={6} key={index}>
                <ProjectCard
                  uid={uid}
                  applications={item.applications}
                  listingId={item.docID}
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
          <Grid container spacing={4}>
            {researchApplications.map((item, index) => (
              <Grid item xs={12} md={12} lg={6} key={index}>
                <ApplicationCard
                  userRole={role}
                  project_title={item.project_title || 'N/A'}
                  department={item.department || 'N/A'}
                  faculty_mentor={
                    `${item.first_name} ${item.last_name}`.trim() || 'N/A'
                  }
                  terms_available={item.terms_available}
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
        )}
      </Box>
    </Container>
  );
};

export default StudentResearchView;
