'use client';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { Bio } from '@/components/Bio/Bio';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useUserRole } from '@/firebase/util/GetUserRole';
import { testData } from './testdata';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ProjectCard from '@/components/Research/ProjectCard';
import SearchBox from '@/components/Research/SearchBox';
interface ResearchPageProps {
  user: {
    uid: string;
    fullName: string;
    bio: string;
  };
}

const ResearchPage: React.FC<ResearchPageProps> = () => {
  const [department, setDepartment] = React.useState('');
  const [studentLevel, setStudentLevel] = React.useState('');
  const [termsAvailable, setTermsAvailable] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  const auth = getAuth();
  const user = auth.currentUser;
  const {
    role,
    loading: roleLoading,
    error: roleError,
  } = useUserRole(user?.uid);

  if (roleError) {
    return <p>Error loading role</p>;
  }

  if (!user) {
    return <p>Please sign in.</p>;
  }
  return (
    <>
      <Toaster />
      <HeaderCard text="Research Job Board" />
      {roleLoading ? <><h1>loading</h1></> : (
        <>
          {role === 'student_applying' && (
            <Box
              marginLeft="5%"
              marginRight="5%"
            >
              <Box
                marginTop="380px"
                justifyContent="space-between"
                display="flex"
                flexWrap="wrap"
              >
                <SearchBox sx={{minWidth: 800, width:"60%"}}/>

                {/* Department dropdown */}
                <FormControl variant="outlined" sx={{ minWidth: 200, width:"10%" }}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    label="Department"
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="dept1">Department 1</MenuItem>
                    <MenuItem value="dept2">Department 2</MenuItem>
                  </Select>
                </FormControl>

                {/* Student Level dropdown */}
                <FormControl variant="outlined" sx={{ minWidth: 200, width:"10%" }}>
                  <InputLabel>Student Level</InputLabel>
                  <Select
                    value={studentLevel}
                    onChange={(e) => setStudentLevel(e.target.value)}
                    label="Student Level"
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="undergrad">Undergraduate</MenuItem>
                    <MenuItem value="grad">Graduate</MenuItem>
                  </Select>
                </FormControl>

                {/* Terms Available dropdown */}
                <FormControl variant="outlined" sx={{ minWidth: 200, width:"10%" }}>
                  <InputLabel>Terms Available</InputLabel>
                  <Select
                    value={termsAvailable}
                    onChange={(e) => setTermsAvailable(e.target.value)}
                    label="Terms Available"
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="fall">Fall</MenuItem>
                    <MenuItem value="spring">Spring</MenuItem>
                    <MenuItem value="summer">Summer</MenuItem>
                  </Select>
                </FormControl>

              </Box>
              <Grid container
                spacing={5}
                marginTop="10px"
              >
                {testData.map((item, index) => (
                  <Grid item md={6} alignItems="flex-start">
                    <ProjectCard key={index} {...item} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}
    </>
  );
};

export default ResearchPage;
