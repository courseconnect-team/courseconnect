import React, { useState, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import { useDebounce } from '@/hooks/useDebounce';
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
}) => {
  const [myPostingsOnly, setMyPostingsOnly] = useState(false);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText.trim(), 500);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isFacultyOrAdmin = role === 'faculty' || role === 'admin';

  // Department is filtered server-side by the parent's fetch; level, terms and
  // "my postings" are narrowed here before fuzzy search.
  const candidates = useMemo(() => {
    let filtered = researchListings;

    if (myPostingsOnly && isFacultyOrAdmin) {
      filtered = filtered.filter(
        (item) => item.faculty_members?.includes(uid) || item.creator_id === uid
      );
    }

    if (studentLevel) {
      // Word-start match so "Graduate" doesn't hit "Undergraduate" but
      // "Juniors" still matches "Junior". Levels are fixed menu values.
      const levelPattern = new RegExp(`\\b${studentLevel}`, 'i');
      filtered = filtered.filter((item) =>
        levelPattern.test(item.student_level ?? '')
      );
    }

    if (termsAvailable) {
      filtered = filtered.filter((item) =>
        item.terms_available
          ?.toLowerCase()
          .includes(termsAvailable.toLowerCase())
      );
    }

    return filtered;
  }, [
    researchListings,
    myPostingsOnly,
    isFacultyOrAdmin,
    uid,
    studentLevel,
    termsAvailable,
  ]);

  const fuse = useMemo(
    () =>
      new Fuse(candidates, {
        keys: [
          { name: 'project_title', weight: 3 },
          {
            name: 'faculty_mentor',
            weight: 2,
            // Stored either as a name string or an { email: name } map.
            getFn: (item: any) =>
              item.faculty_mentor && typeof item.faculty_mentor === 'object'
                ? Object.values(item.faculty_mentor as Record<string, string>)
                : item.faculty_mentor ?? '',
          },
          { name: 'faculty_contact', weight: 1 },
          { name: 'project_description', weight: 1 },
          { name: 'prerequisites', weight: 0.5 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [candidates]
  );

  // Results come back in relevance order when searching.
  const visibleListings = useMemo(
    () =>
      debouncedSearch
        ? fuse.search(debouncedSearch).map((r) => r.item)
        : candidates,
    [fuse, debouncedSearch, candidates]
  );

  const handleSearchChange = (value: string) => {
    setSearchText(value);
  };

  const clearAll = () => {
    setSearchText('');
    setDepartment('');
    setStudentLevel('');
    setTermsAvailable('');
    setMyPostingsOnly(false);
  };

  const hasActiveFilters = Boolean(
    searchText || department || studentLevel || termsAvailable || myPostingsOnly
  );

  const resultCount = visibleListings.length;
  const totalCount = researchListings.length;

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
              onChange={(e) => setDepartment(e.target.value as string)}
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
              onChange={(e) => setStudentLevel(e.target.value as string)}
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
              onChange={(e) => setTermsAvailable(e.target.value as string)}
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
              onClick={() => setMyPostingsOnly((prev) => !prev)}
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
                  onDelete={() => setDepartment('')}
                  size="small"
                  sx={{ backgroundColor: '#F4F1FC', color: '#4A35B8' }}
                />
              )}
              {studentLevel && (
                <Chip
                  label={studentLevel}
                  onDelete={() => setStudentLevel('')}
                  size="small"
                  sx={{ backgroundColor: '#F4F1FC', color: '#4A35B8' }}
                />
              )}
              {termsAvailable && (
                <Chip
                  label={termsAvailable}
                  onDelete={() => setTermsAvailable('')}
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
                  onDelete={() => setMyPostingsOnly(false)}
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
          {visibleListings.map((item) => (
            <Grid item xs={12} sm={6} lg={4} key={item.docID}>
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
