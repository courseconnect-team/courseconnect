'use client';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useUserRole } from '@/firebase/util/GetUserRole';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
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
  Link,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ProjectCard from '@/components/Research/ProjectCard';
import SearchBox from '@/components/Research/SearchBox';
import firebase from '@/firebase/firebase_config';
import ResearchModal from '@/components/Research/Modal';
import { JobCard } from '@/components/JobCard/JobCard';
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
  const [researchListings, setResearchListings] = useState<ResearchListing[]>(
    []
  );

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
    let collectionRef: firebase.firestore.Query<firebase.firestore.DocumentData> =
      firebase.firestore().collection('research-listings');
    if (department) {
      collectionRef = collectionRef.where('department', '==', department);
    }
    if (studentLevel) {
      collectionRef = collectionRef.where(
        'student_level.' + studentLevel,
        '==',
        true
      );
    }
    if (termsAvailable) {
      collectionRef = collectionRef.where(
        'terms_available.' + termsAvailable,
        '==',
        true
      );
    }
    let snapshot = await collectionRef.get();
    // Execute the query.
    let researchListings: ResearchListing[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setResearchListings(researchListings);
  };

  const postNewResearchPosition = async (formData: any) => {
    try {
      const docRef = await addDoc(
        collection(firebase.firestore(), 'research-listings'),
        formData
      );
      console.log('Document written with ID: ', docRef.id);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  const patchResearchPosting = async (formData: any) => {
    console.log('formData: ', formData);
    const docRef = doc(firebase.firestore(), 'research-listings', formData.id);
    try {
      // This updates only the specified fields without overwriting the entire document.
      await updateDoc(docRef, formData);
      console.log('Document updated successfully!');
    } catch (error) {
      console.error('Error updating document: ', error);
    }
  };

  return (
    <>
      <Toaster />
      {roleLoading ? (
        <>
          <h1>loading</h1>
        </>
      ) : (
        <>
          {role === 'student_applying' && (
            <>
              <HeaderCard text="Applications" />
              <Box sx={{ p: 3 }}>
                {/* Top-level heading */}
                <Typography variant="h4" gutterBottom>
                  Research
                </Typography>

                {/* Container for "My Positions" and the button */}
                <Box
                  marginTop="380px"
                  justifyContent="space-between"
                  display="flex"
                  flexWrap="wrap"
                >
                  {/* Left side: "My Positions" and link/label */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    marginBottom="16px"
                  >
                    {/* Text Search Bar */}
                    <TextField
                      label="Search Positions"
                      variant="outlined"
                      size="small"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const searchText = (
                            e.target as HTMLInputElement
                          ).value.toLowerCase();
                          const filteredListings = researchListings.filter(
                            (item) =>
                              item.project_title
                                .toLowerCase()
                                .includes(searchText)
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

                    {/* Clear Button */}
                    <Button
                      variant="outlined"
                      onClick={() => getResearchListings()} // Fetch all listings again
                      sx={{ marginRight: '16px', height: '40px' }}
                    >
                      Clear
                    </Button>

                    {/* Filters */}
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
                        <MenuItem value="Computer Science">
                          Computer Science
                        </MenuItem>
                        <MenuItem value="Biology">Biology</MenuItem>
                        <MenuItem value="Physics">Physics</MenuItem>
                        {/* Add more departments as needed */}
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
                          application_requirements={
                            item.application_requirements
                          }
                          application_deadline={item.application_deadline}
                          website={item.website}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </>
          )}
          {role === 'faculty' && (
            <>
              <HeaderCard text="Applications" />
              <Box sx={{ p: 3 }}>
                {/* Top-level heading */}
                <Typography variant="h4" gutterBottom>
                  Research
                </Typography>

                {/* Container for "My Positions" and the button */}
                <Box
                  marginTop="380px"
                  justifyContent="space-between"
                  display="flex"
                  flexWrap="wrap"
                >
                  {/* Left side: "My Positions" and link/label */}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      My Positions:
                    </Typography>
                  </Box>
                  <ResearchModal
                    onSubmitSuccess={getResearchListings}
                    firebaseQuery={postNewResearchPosition}
                    buttonText="Create New Position"
                    currentFormData={{
                      id: '',
                      project_title: '',
                      department: '',
                      faculty_mentor: '',
                      phd_student_mentor: '',
                      terms_available: '',
                      student_level: '',
                      prerequisites: '',
                      credit: '',
                      stipend: '',
                      application_requirements: '',
                      application_deadline: '',
                      website: '',
                      project_description: '',
                    }}
                    buttonStyle={{
                      backgroundColor: '#5A41D8', // Same purple as Edit Application
                      color: '#FFFFFF', // White text
                      textTransform: 'none', // Keep text normal case
                      borderRadius: '8px', // Rounded corners
                      boxShadow: '0px 0px 8px #E5F0DC', // Subtle greenish glow
                      fontWeight: 500,
                      padding: '10px 24px',
                      '&:hover': {
                        backgroundColor: '#5A41D8', // Keep hover consistent
                        boxShadow: '0px 0px 8px #E5F0DC',
                      },
                    }}
                  />
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
                          application_requirements={
                            item.application_requirements
                          }
                          application_deadline={item.application_deadline}
                          website={item.website}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </>
          )}
        </>
      )}
    </>
  );
};

export default ResearchPage;
