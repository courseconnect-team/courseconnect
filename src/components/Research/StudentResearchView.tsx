import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputBase,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
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
  const [originalListings, setOriginalListings] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (researchListings.length > 0 && originalListings.length === 0) {
      setOriginalListings([...researchListings]);
    }
  }, [researchListings, originalListings.length]);

  const handleSearch = (searchText: string) => {
    if (!searchText && department === '' && termsAvailable === '') {
      setResearchListings([...originalListings]);
      return;
    }

    const listingsToFilter =
      originalListings.length > 0
        ? [...originalListings]
        : [...researchListings];

    let filteredListings = listingsToFilter;

    // Text search
    if (searchText) {
      filteredListings = filteredListings.filter((item) => {
        const searchLower = searchText.toLowerCase();

        const titleMatch =
          item.project_title &&
          typeof item.project_title === 'string' &&
          item.project_title.toLowerCase().includes(searchLower);

        const descriptionMatch =
          item.project_description &&
          typeof item.project_description === 'string' &&
          item.project_description.toLowerCase().includes(searchLower);

        const mentorMatch =
          item.faculty_contact &&
          typeof item.faculty_contact === 'string' &&
          item.faculty_contact.toLowerCase().includes(searchLower);

        return titleMatch || descriptionMatch || mentorMatch;
      });
    }

    // Department filter
    if (department) {
      filteredListings = filteredListings.filter((item) => {
        const normalized = item.department?.toLowerCase().trim();

        if (
          department === 'Computer and Information Sciences and Engineering'
        ) {
          return (
            normalized === 'computer and information science and engineering' ||
            normalized === 'computer and information sciences and engineering'
          );
        }

        return normalized === department.toLowerCase();
      });
    }

    // Terms Available filter
    if (termsAvailable) {
      filteredListings = filteredListings.filter((item) =>
        item.terms_available
          ?.toLowerCase()
          .includes(termsAvailable.toLowerCase())
      );
    }

    setResearchListings(filteredListings);
  };

  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    setTimeout(() => {
      const searchText = searchInputRef.current?.value || '';
      handleSearch(searchText);
    }, 0);
  };

  const handleTermsChange = (value: string) => {
    setTermsAvailable(value);
    setTimeout(() => {
      const searchText = searchInputRef.current?.value || '';
      handleSearch(searchText);
    }, 0);
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Search + filter bar */}
      <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
        {/* Pill-shaped search bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f2ecf9',
            borderRadius: '9999px',
            px: 2,
            height: 48,
            flex: 1,
            minWidth: 200,
          }}
        >
          <SearchIcon sx={{ color: '#5A41D8', mr: 1 }} />
          <InputBase
            placeholder="Search"
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
          <SearchIcon
            sx={{ color: '#999', cursor: 'pointer' }}
            onClick={() => {
              const searchText = searchInputRef.current?.value || '';
              handleSearch(searchText);
            }}
          />
        </Box>

        {/* Department filter */}
        <FormControl
          size="small"
          sx={{
            minWidth: 160,
            '& .MuiOutlinedInput-root': { borderRadius: '20px' },
          }}
        >
          <InputLabel>Department</InputLabel>
          <Select
            value={department}
            label="Department"
            onChange={(e) => handleDepartmentChange(e.target.value as string)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Computer and Information Sciences and Engineering">
              CISE
            </MenuItem>
            <MenuItem value="Electrical and Computer Engineering">ECE</MenuItem>
            <MenuItem value="Engineering Education">Education</MenuItem>
          </Select>
        </FormControl>

        {/* Student Level filter */}
        <FormControl
          size="small"
          sx={{
            minWidth: 160,
            '& .MuiOutlinedInput-root': { borderRadius: '20px' },
          }}
        >
          <InputLabel>Student Level</InputLabel>
          <Select
            value={studentLevel}
            label="Student Level"
            onChange={(e) => {
              setStudentLevel(e.target.value as string);
              getResearchListings();
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Freshman">Freshman</MenuItem>
            <MenuItem value="Sophomore">Sophomore</MenuItem>
            <MenuItem value="Junior">Junior</MenuItem>
            <MenuItem value="Senior">Senior</MenuItem>
            <MenuItem value="Graduate">Graduate</MenuItem>
          </Select>
        </FormControl>

        {/* Terms Available filter */}
        <FormControl
          size="small"
          sx={{
            minWidth: 180,
            '& .MuiOutlinedInput-root': { borderRadius: '20px' },
          }}
        >
          <InputLabel>Terms Available</InputLabel>
          <Select
            value={termsAvailable}
            label="Terms Available"
            onChange={(e) => handleTermsChange(e.target.value as string)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Fall">Fall</MenuItem>
            <MenuItem value="Spring">Spring</MenuItem>
            <MenuItem value="Summer">Summer</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Research Listings */}
      <Grid container spacing={3}>
        {researchListings.map((item, index) => (
          <Grid item xs={12} md={6} key={index}>
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
              faculty_contact={item.faculty_contact}
              phd_student_contact={item.phd_student_contact}
              compensation={item.compensation}
              nature_of_job={item.nature_of_job}
              hours_per_week={item.hours_per_week}
              image_url={item.image_url}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StudentResearchView;
