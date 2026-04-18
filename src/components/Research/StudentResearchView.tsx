import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputBase,
  Button,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
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

const DEPARTMENT_LABELS: Record<string, string> = {
  'Computer and Information Sciences and Engineering': 'CISE',
  'Electrical and Computer Engineering': 'ECE',
  'Engineering Education': 'Education',
};

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
  const [myPostingsOnly, setMyPostingsOnly] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isFacultyOrAdmin = role === 'faculty' || role === 'admin';

  useEffect(() => {
    if (researchListings.length > 0 && originalListings.length === 0) {
      setOriginalListings([...researchListings]);
    }
  }, [researchListings, originalListings.length]);

  const applyFilters = (
    searchOverride?: string,
    myPostingsOverride?: boolean
  ) => {
    const search = searchOverride ?? searchText;
    const showMine = myPostingsOverride ?? myPostingsOnly;

    if (!search && !department && !termsAvailable && !showMine) {
      setResearchListings([...originalListings]);
      return;
    }

    const source =
      originalListings.length > 0
        ? [...originalListings]
        : [...researchListings];
    let filtered = source;

    if (showMine && isFacultyOrAdmin) {
      filtered = filtered.filter(
        (item) => item.faculty_members?.includes(uid) || item.creator_id === uid
      );
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter((item) => {
        const t =
          typeof item.project_title === 'string' &&
          item.project_title.toLowerCase().includes(lower);
        const d =
          typeof item.project_description === 'string' &&
          item.project_description.toLowerCase().includes(lower);
        const m =
          typeof item.faculty_contact === 'string' &&
          item.faculty_contact.toLowerCase().includes(lower);
        return t || d || m;
      });
    }

    if (department) {
      filtered = filtered.filter((item) => {
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

    if (termsAvailable) {
      filtered = filtered.filter((item) =>
        item.terms_available
          ?.toLowerCase()
          .includes(termsAvailable.toLowerCase())
      );
    }

    setResearchListings(filtered);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    if (value === '') applyFilters('');
  };

  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    setTimeout(() => applyFilters(), 0);
  };

  const handleTermsChange = (value: string) => {
    setTermsAvailable(value);
    setTimeout(() => applyFilters(), 0);
  };

  const clearAll = () => {
    setSearchText('');
    setDepartment('');
    setStudentLevel('');
    setTermsAvailable('');
    setMyPostingsOnly(false);
    setResearchListings([...originalListings]);
  };

  const hasActiveFilters = Boolean(
    searchText || department || studentLevel || termsAvailable || myPostingsOnly
  );

  const resultCount = researchListings.length;
  const totalCount = originalListings.length || researchListings.length;

  return (
    <Box sx={{ mb: 4 }}>
      {/* Filter toolbar */}
      <Box
        sx={{
          backgroundColor: '#fff',
          border: '1px solid #EEE9F7',
          borderRadius: '16px',
          p: 2,
          mb: 2.5,
          boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          {/* Search */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F6F3FC',
              borderRadius: '999px',
              px: 2,
              height: 44,
              flex: '1 1 260px',
              minWidth: 220,
              transition: 'box-shadow 0.15s ease',
              '&:focus-within': {
                boxShadow: '0 0 0 3px rgba(90, 65, 216, 0.18)',
                backgroundColor: '#fff',
              },
            }}
          >
            <SearchIcon sx={{ color: '#5A41D8', mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder="Search projects, faculty, keywords…"
              value={searchText}
              inputRef={searchInputRef}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyFilters();
                }
              }}
              sx={{ flex: 1, fontSize: '0.9rem' }}
            />
            {searchText && (
              <CloseIcon
                sx={{
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: 18,
                  '&:hover': { color: '#5A41D8' },
                }}
                onClick={() => handleSearchChange('')}
              />
            )}
          </Box>

          <FormControl
            size="small"
            sx={{
              minWidth: 160,
              '& .MuiOutlinedInput-root': { borderRadius: '999px' },
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
              <MenuItem value="Electrical and Computer Engineering">
                ECE
              </MenuItem>
              <MenuItem value="Engineering Education">Education</MenuItem>
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{
              minWidth: 160,
              '& .MuiOutlinedInput-root': { borderRadius: '999px' },
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

          <FormControl
            size="small"
            sx={{
              minWidth: 160,
              '& .MuiOutlinedInput-root': { borderRadius: '999px' },
            }}
          >
            <InputLabel>Terms</InputLabel>
            <Select
              value={termsAvailable}
              label="Terms"
              onChange={(e) => handleTermsChange(e.target.value as string)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Fall">Fall</MenuItem>
              <MenuItem value="Spring">Spring</MenuItem>
              <MenuItem value="Summer">Summer</MenuItem>
            </Select>
          </FormControl>

          {isFacultyOrAdmin && (
            <Button
              variant={myPostingsOnly ? 'contained' : 'outlined'}
              startIcon={<PersonOutlineIcon />}
              onClick={() => {
                const next = !myPostingsOnly;
                setMyPostingsOnly(next);
                applyFilters(undefined, next);
              }}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                height: 40,
                ...(myPostingsOnly
                  ? {
                      backgroundColor: '#5A41D8',
                      color: '#fff',
                      boxShadow: 'none',
                      '&:hover': { backgroundColor: '#4A35B8' },
                    }
                  : {
                      borderColor: '#D7CCF4',
                      color: '#5A41D8',
                      '&:hover': {
                        borderColor: '#5A41D8',
                        backgroundColor: 'rgba(90, 65, 216, 0.04)',
                      },
                    }),
              }}
            >
              My Postings
            </Button>
          )}
        </Box>

        {/* Active filter chips + result summary */}
        {(hasActiveFilters || totalCount > 0) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5,
              mt: 1.75,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: 'wrap', rowGap: 1 }}
            >
              {department && (
                <Chip
                  label={DEPARTMENT_LABELS[department] || department}
                  onDelete={() => handleDepartmentChange('')}
                  size="small"
                  sx={{ backgroundColor: '#F4F1FC', color: '#4A35B8' }}
                />
              )}
              {studentLevel && (
                <Chip
                  label={studentLevel}
                  onDelete={() => {
                    setStudentLevel('');
                    getResearchListings();
                  }}
                  size="small"
                  sx={{ backgroundColor: '#F4F1FC', color: '#4A35B8' }}
                />
              )}
              {termsAvailable && (
                <Chip
                  label={termsAvailable}
                  onDelete={() => handleTermsChange('')}
                  size="small"
                  sx={{ backgroundColor: '#F4F1FC', color: '#4A35B8' }}
                />
              )}
              {searchText && (
                <Chip
                  label={`"${searchText}"`}
                  onDelete={() => handleSearchChange('')}
                  size="small"
                  sx={{ backgroundColor: '#F4F1FC', color: '#4A35B8' }}
                />
              )}
              {myPostingsOnly && (
                <Chip
                  label="My Postings"
                  onDelete={() => {
                    setMyPostingsOnly(false);
                    applyFilters(undefined, false);
                  }}
                  size="small"
                  sx={{ backgroundColor: '#F4F1FC', color: '#4A35B8' }}
                />
              )}
              {hasActiveFilters && (
                <Button
                  onClick={clearAll}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    color: '#8D88A1',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    minWidth: 'auto',
                    px: 1,
                  }}
                >
                  Clear all
                </Button>
              )}
            </Stack>
            <Typography
              variant="body2"
              sx={{
                color: '#6B5AA8',
                fontWeight: 500,
                fontSize: '0.82rem',
              }}
            >
              {hasActiveFilters
                ? `${resultCount} of ${totalCount} ${
                    totalCount === 1 ? 'position' : 'positions'
                  }`
                : `${totalCount} ${
                    totalCount === 1 ? 'position' : 'positions'
                  } available`}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Listings */}
      {resultCount === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            py: 8,
            px: 3,
            border: '1px dashed #D7CCF4',
            borderRadius: '16px',
            backgroundColor: '#FBFAFE',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#F4F1FC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <ScienceOutlinedIcon sx={{ color: '#5A41D8', fontSize: 32 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#1F1B2E', mb: 0.5 }}
          >
            No matching positions
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#6B6B78', maxWidth: 420, mb: 2 }}
          >
            {hasActiveFilters
              ? 'Try adjusting or clearing your filters to see more results.'
              : "There aren't any research positions posted right now. Check back soon."}
          </Typography>
          {hasActiveFilters && (
            <Button
              onClick={clearAll}
              variant="outlined"
              sx={{
                textTransform: 'none',
                borderRadius: '999px',
                borderColor: '#D7CCF4',
                color: '#5A41D8',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#5A41D8',
                  backgroundColor: 'rgba(90, 65, 216, 0.04)',
                },
              }}
            >
              Clear filters
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {researchListings.map((item, index) => (
            <Grid item xs={12} sm={6} lg={4} key={index}>
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
      )}
    </Box>
  );
};

export default StudentResearchView;
