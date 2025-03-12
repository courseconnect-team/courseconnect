'use client';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { Bio } from '@/components/Bio/Bio';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useUserRole } from '@/firebase/util/GetUserRole';
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
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
    let collectionRef: firebase.firestore.Query<firebase.firestore.DocumentData> = firebase.firestore().collection("research-listings");
    if (department) {
      collectionRef = collectionRef.where('department', '==', department);
    }
    if (studentLevel) {
      collectionRef = collectionRef.where('student_level.' + studentLevel, '==', true);
    }
    if (termsAvailable) {
      collectionRef = collectionRef.where('terms_available.' + termsAvailable, '==', true);
    }
    let snapshot = await collectionRef.get();
    // Execute the query.
    let researchListings: ResearchListing[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setResearchListings(researchListings);
  }

  const postNewResearchPosition = async (formData: any) => {
    try {
      const docRef = await addDoc(collection(firebase.firestore(), "research-listings"), formData);
      console.log("Document written with ID: ", docRef.id);
  } catch (e) {
      console.error("Error adding document: ", e);
  }
  }

  const patchResearchPosting = async (formData: any) => {
    console.log("formData: ", formData);
    const docRef = doc(firebase.firestore(), "research-listings", formData.id);
    try {
      // This updates only the specified fields without overwriting the entire document.
      await updateDoc(docRef, formData);
      console.log("Document updated successfully!");
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  }

  return (
    <>
      <Toaster />
      {roleLoading ? <><h1>loading</h1></> : (
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
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      My Positions:
                    </Typography>
                  </Box>
                  <ResearchModal onSubmitSuccess={getResearchListings}
                    firebaseQuery={postNewResearchPosition}
                    buttonText="Create New Position"
                    currentFormData={
                      {
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
                        project_description: ''
                      }
                    }
                    buttonStyle={{
                      backgroundColor: '#FFFFFF',
                      color: '#555555',
                      borderRadius: 9999,
                      boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.1)',
                      textTransform: 'none',
                      padding: '8px 24px',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: '#f7f7f7',
                        boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.15)',
                      },
                    }} />
                  <Grid container
                    spacing={5}
                    marginTop="10px"
                    marginLeft="5%"
                    marginRight="5%"
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
                          projectCardObj.student_level += ", " + key
                        }
                        studentLevelCounter += 1
                      }

                      var termsCounter = 0
                      for (const [key, value] of Object.entries(item.terms_available)) {
                        if (termsCounter == 0) {
                          projectCardObj.terms_available += key
                        } else if (value) {
                          projectCardObj.terms_available += ", " + key
                        }
                        termsCounter += 1
                      }


                      return (
                        <Grid item md={12} alignItems="flex-start">
                          <ProjectCard key={index} {...projectCardObj}>
                            <Box
                              justifyContent="space-between"
                              display="flex"
                              flexWrap="wrap"
                            >
                              <ResearchModal onSubmitSuccess={getResearchListings}
                                firebaseQuery={patchResearchPosting}
                                buttonText="Edit Posting"
                                currentFormData={
                                  {
                                    id: item.id,
                                    project_title: projectCardObj.project_title,
                                    department: projectCardObj.department,
                                    faculty_mentor: projectCardObj.faculty_mentor,
                                    phd_student_mentor: projectCardObj.phd_student_mentor,
                                    terms_available: projectCardObj.terms_available,
                                    student_level: projectCardObj.student_level,
                                    prerequisites: projectCardObj.prerequisites,
                                    credit: projectCardObj.credit,
                                    stipend: projectCardObj.stipend,
                                    application_requirements: projectCardObj.application_requirements,
                                    application_deadline: projectCardObj.application_deadline,
                                    website: projectCardObj.website,
                                    project_description: projectCardObj.project_description
                                  }
                                }
                                buttonStyle={{
                                  backgroundColor: '#5A41D8',    // Approx. purple
                                  color: '#FFFFFF',
                                  textTransform: 'none',        // Keep text as-is
                                  borderRadius: '12px',         // Rounded corners
                                  boxShadow: '0px 0px 8px #E5F0DC', // Subtle greenish glow
                                  fontWeight: 500,
                                  // Keep hover state consistent, or adjust to your preference
                                  '&:hover': {
                                    backgroundColor: '#5A41D8',
                                    boxShadow: '0px 0px 8px #E5F0DC',
                                  },
                                }} />
                              <Button
                                sx={{
                                  backgroundColor: '#5A41D8',    // Approx. purple
                                  color: '#FFFFFF',
                                  textTransform: 'none',        // Keep text as-is
                                  borderRadius: '12px',         // Rounded corners
                                  boxShadow: '0px 0px 8px #E5F0DC', // Subtle greenish glow
                                  fontWeight: 500,
                                  // Keep hover state consistent, or adjust to your preference
                                  '&:hover': {
                                    backgroundColor: '#5A41D8',
                                    boxShadow: '0px 0px 8px #E5F0DC',
                                  },
                                }}>
                                Show Applications
                              </Button>
                            </Box>
                          </ProjectCard>
                        </Grid>
                      )
                    })}
                  </Grid>
                </Box>

              </Box>
            </>
          )}
        </>
      )
      }
    </>
  );
};

export default ResearchPage;
