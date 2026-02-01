'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { getNavItems } from '@/hooks/useGetItems';
import PageLayout from '@/components/PageLayout/PageLayout';
import firebase from '@/firebase/firebase_config';
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
  faculty_mentor: {};
  phd_student_mentor: string | {};
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
  project_title: string;
  faculty_mentor: {};
  project_description: string;
}

const ResearchPage: React.FC<ResearchPageProps> = () => {
  const [user, role, loading, error] = useUserInfo();

  const [department, setDepartment] = React.useState('');
  const [studentLevel, setStudentLevel] = React.useState('');
  const [termsAvailable, setTermsAvailable] = React.useState('');
  const [researchListings, setResearchListings] = useState<ResearchListing[]>(
    []
  );
  const [researchApplications, setResearchApplications] = useState<
    ResearchApplication[]
  >([]);

  const getResearchListings = useCallback(async () => {
    let collectionRef: firebase.firestore.Query<firebase.firestore.DocumentData> =
      firebase.firestore().collection('research-listings');
    if (department) {
      collectionRef = collectionRef.where('department', '==', department);
    }
    if (studentLevel) {
      collectionRef = collectionRef.where('student_level', '==', studentLevel);
    }
    let snapshot = await collectionRef.get();
    let listings: ResearchListing[] = await Promise.all(
      snapshot.docs.map(async (doc: any) => {
        const detailsSnap = await doc.ref.collection('applications').get();
        const apps = detailsSnap.docs.map(
          (d: firebase.firestore.QueryDocumentSnapshot) => ({
            id: d.id,
            ...d.data(),
          })
        );
        return {
          docID: doc.id,
          applications: apps,
          ...doc.data(),
        };
      })
    );
    setResearchListings(listings);
  }, [department, studentLevel]);

  const getApplications = useCallback(async () => {
    if (!user?.uid) return;
    const snapshot = await firebase
      .firestore()
      .collectionGroup('applications')
      .where('uid', '==', user.uid)
      .get();
    const results = await Promise.all(
      snapshot.docs.map(async (appDoc) => {
        const appData = appDoc.data();

        // navigate back up to the parent document
        var listingRef = appDoc.ref.parent.parent;
        let listingData: any = {};
        if (listingRef) {
          const listingSnap = await listingRef.get();
          if (listingSnap.exists) {
            listingData = listingSnap.data();
          }
        }

        return {
          appId: appDoc.id,
          ...appData,
          listingId: listingRef?.id ?? null,
          listingData,
        };
      })
    );

    let applications: ResearchApplication[] = results.map((doc: any) => ({
      appid: doc.appId,
      app_status: doc.app_status,
      terms_available: doc.listingData.terms_available,
      date_applied: doc.date,
      degree: doc.degree,
      department: doc.department,
      email: doc.email,
      first_name: doc.firstname,
      last_name: doc.lastname,
      gpa: doc.gpa,
      graduation_date: doc.graduation_date,
      phone_number: doc.phone_number,
      qualifications: doc.qualifications,
      resume: doc.resume,
      uid: doc.uid,
      weekly_hours: doc.weekly_hours,
      faculty_mentor: doc.listingData.faculty_mentor,
      project_title: doc.listingData.project_title,
      project_description: doc.listingData.project_description,
    }));
    setResearchApplications(applications);
  }, [user?.uid]);

  const postNewResearchPosition = useCallback(async (formData: any) => {
    try {
      const docRef = await firebase
        .firestore()
        .collection('research-listings')
        .add(formData);
      console.log('Document written with ID: ', docRef.id);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      getResearchListings();
      getApplications();
    }
  }, [user, getResearchListings, getApplications]);

  if (error) {
    return <p>Error loading role</p>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <p>Please sign in.</p>;
  }

  return (
    <>
      <Toaster />
      <PageLayout mainTitle="Research" navItems={getNavItems(role)}>
        {(role === 'student_applying' || role === 'student_applied') && (
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
      </PageLayout>
    </>
  );
};

export default ResearchPage;
