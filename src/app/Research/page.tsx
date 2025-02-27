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
import firebase from '@/firebase/firebase_config';
interface ResearchPageProps {
  user: {
    uid: string;
    fullName: string;
    bio: string;
  };
}

interface ResearchListing {
  id: string;
  project_title: string;
  department: string;
  faculty_mentor: string;
  phd_student_mentor: string;
  terms_available: {
    spring: boolean;
    summer: boolean;
    fall: boolean;
  };
  student_level: {
    freshman: boolean;
    sophomore: boolean;
    junior: boolean;
    senior: boolean;
  };
  prerequisites: string;
  credit: string;
  stipend: string;
  application_requirements: string;
  application_deadline: string;
  website: string;
  project_description: string;
}

const ResearchPage: React.FC<ResearchPageProps> = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const {
    role,
    loading: roleLoading,
    error: roleError,
  } = useUserRole(user?.uid);

  const [department, setDepartment] = React.useState('');
  const [studentLevel, setStudentLevel] = React.useState('');
  const [termsAvailable, setTermsAvailable] = React.useState('');
  const [researchListings, setResearchListings] = useState<ResearchListing[]>([]);

  useEffect(() => {
    getResearchListings();
  }, []);

  if (roleError) {
    return <p>Error loading role</p>;
  }

  if (!user) {
    return <p>Please sign in.</p>;
  }

  const getResearchListings = async () => {
    console.log(department, studentLevel, termsAvailable);
    let collectionRef: firebase.firestore.Query<firebase.firestore.DocumentData> = firebase.firestore().collection("research-listings");
    if (department) {
      collectionRef = collectionRef.where('department', '==', department);
    }
    if (studentLevel) {
      collectionRef = collectionRef.where('student_level.'+studentLevel, '==', true);
    }
    if (termsAvailable) {
      collectionRef = collectionRef.where('terms_available.'+termsAvailable, '==', true);
    }
    let snapshot = await collectionRef.get();  
    // Execute the query.
    let researchListings: ResearchListing[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setResearchListings(researchListings);
    console.log(researchListings);
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
                <SearchBox sx={{minWidth: 800, width:"60%"}} researchListingsFunc={()=> getResearchListings()}/>

                {/* Department dropdown */}
                <FormControl variant="outlined" sx={{ minWidth: 200, width:"10%" }}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    label="Department"
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="CISE">CISE</MenuItem>
                    <MenuItem value="TEST">TEST</MenuItem>
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
                    <MenuItem value="freshman">freshman</MenuItem>
                    <MenuItem value="sophmore">sophmore</MenuItem>
                    <MenuItem value="junior">junior</MenuItem>
                    <MenuItem value="senior">senior</MenuItem>
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
                {researchListings.map((item, index) => {
                  let projectCardObj = {
                    project_title: item.project_title,
                    department: item.department,
                    faculty_mentor: item.faculty_mentor,
                    terms_available: "",
                    student_level: "",
                    project_description: item.project_description,
                    phd_student_mentor: item.phd_student_mentor,
                    prerequisites: item.prerequisites,
                    credit: item.credit,
                    stipend: item.stipend,
                    application_requirements: item.application_requirements,
                    application_deadline: item.application_deadline,
                    website: item.website
                  }
                  var studentLevelCounter = 0
                  for (const [key, value] of Object.entries(item.student_level)) {
                    if (studentLevelCounter == 0) {
                      projectCardObj.student_level += key
                    } else if (value) {
                      projectCardObj.student_level += ", "+key
                    }
                    studentLevelCounter+=1
                  }

                  var termsCounter = 0
                  for (const [key, value] of Object.entries(item.terms_available)) {
                    if (termsCounter == 0) {
                      projectCardObj.terms_available += key
                    } else if (value) {
                      projectCardObj.terms_available += ", "+key
                    }
                    termsCounter+=1
                  }
                  

                  return (
                  
                  <Grid item md={6} alignItems="flex-start">
                    <ProjectCard key={index} {...projectCardObj} />
                  </Grid>
                )})}
              </Grid>
            </Box>
          )}
        </>
      )}
    </>
  );
};

export default ResearchPage;
