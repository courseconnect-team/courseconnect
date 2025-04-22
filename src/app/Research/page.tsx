'use client';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useUserRole } from '@/firebase/util/GetUserRole';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  collectionGroup,
  query,
  where,
} from 'firebase/firestore';
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
import StudentResearchView from '@/components/Research/StudentResearchView';
import FacultyResearchView from '@/components/Research/FacultyResearchView';
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
  terms_available: string;
  student_level: string;
  prerequisites: string;
  credit: string;
  stipend: string;
  application_requirements: string;
  application_deadline: string;
  website: string;
  project_description: string;
}

interface ResearchApplication {
  appid: string;
  app_status: string;
  terms_available: string;
  date_applied: string;
  degree: string;
  department: string;
  email: string;
  first_name: string;
  last_name: string;
  gpa: string;
  graduation_date: string;
  phone_number: string;
  qualifications: string;
  resume: string;
  uid: string;
  weekly_hours: string;
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
  const [researchApplications, setResearchApplications] = useState<
    ResearchApplication[]
  >([]);

  useEffect(() => {
    getResearchListings();
    getApplications();
  });

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
      collectionRef = collectionRef.where('student_level', '==', studentLevel);
    }
    // if (termsAvailable) {
    //   collectionRef = collectionRef.where(
    //     'terms_available',
    //     '==',
    //     termsAvailable
    //   );
    // }
    let snapshot = await collectionRef.get();
    let researchListings: ResearchListing[] = await Promise.all(
      snapshot.docs.map(async (doc: any) => {
        const detailsSnap = await getDocs(collection(doc.ref, 'applications'));
        const apps = detailsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        return {
          docID: doc.id,
          applications: apps,
          ...doc.data(),
        };
      })
    );
    setResearchListings(researchListings);
  };

  const getApplications = async () => {
    const appsQ = query(
      collectionGroup(firebase.firestore(), 'applications'),
      where('uid', '==', user.uid)
    );
    const snapshot = await getDocs(appsQ);

    let researchApplications: ResearchApplication[] = snapshot.docs.map(
      (doc: any) => ({
        appid: doc.id,
        app_status: doc.data().app_status,
        terms_available: doc.data().terms_available,
        date_applied: doc.data().date_applied,
        degree: doc.data().degree,
        department: doc.data().department,
        email: doc.data().email,
        first_name: doc.data().first_name,
        last_name: doc.data().last_name,
        gpa: doc.data().gpa,
        graduation_date: doc.data().graduation_date,
        phone_number: doc.data().phone_number,
        qualifications: doc.data().qualifications,
        resume: doc.data().resume,
        uid: doc.data().uid,
        weekly_hours: doc.data().weekly_hours,
      })
    );
    setResearchApplications(researchApplications);
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
  return (
    <>
      <Toaster />

      {roleLoading ? (
        <>
          <h1>loading</h1>
        </>
      ) : (
        <>
          {(role === 'student_applying' || role === 'student_applied') && (
            <>
              <HeaderCard text="Applications" />
              <StudentResearchView
                  researchListings={researchListings}
                  researchApplications={researchApplications}
                  role={role}
                  uid={user.uid}
                  department={department}
                  setDepartment={setDepartment}
                  studentLevel={studentLevel}
                  setStudentLevel={setStudentLevel}
                  getResearchListings={getResearchListings}
                  setResearchListings={setResearchListings}
                  getApplications={getApplications}
                  termsAvailable={termsAvailable}
                  setTermsAvailable={setTermsAvailable}
                  setResearchApplications={setResearchApplications}
                 />
            </>
          )}
          {role === 'faculty' && (
            <FacultyResearchView
              researchListings={researchListings}
              role={role}
              uid={user.uid}
              getResearchListings={getResearchListings}
              postNewResearchPosition={postNewResearchPosition}
            />
          )}
        </>
      )}
    </>
  );
};

export default ResearchPage;
