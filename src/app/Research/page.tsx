'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { getNavItems } from '@/hooks/useGetItems';
import PageLayout from '@/components/PageLayout/PageLayout';
import firebase from '@/firebase/firebase_config';
import StudentResearchView from '@/components/Research/StudentResearchView';
import FacultyResearchView from '@/components/Research/FacultyResearchView';
import {
  ResearchListing,
  normalizeResearchListing,
} from '@/app/models/ResearchModel';

const ResearchPage: React.FC = () => {
  const [user, role, loading, error] = useUserInfo();

  const [department, setDepartment] = React.useState('');
  const [studentLevel, setStudentLevel] = React.useState('');
  const [termsAvailable, setTermsAvailable] = React.useState('');
  const [researchListings, setResearchListings] = useState<ResearchListing[]>(
    []
  );

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
        return normalizeResearchListing({
          docID: doc.id,
          applications: apps,
          ...doc.data(),
        });
      })
    );
    setResearchListings(listings);
  }, [department, studentLevel]);

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
    }
  }, [user, getResearchListings]);

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
      <PageLayout
        mainTitle="Research Applications"
        navItems={getNavItems(role)}
      >
        {(role === 'student_applying' || role === 'student_applied') && (
          <StudentResearchView
            researchListings={researchListings}
            role={role}
            uid={user.uid}
            department={department}
            setDepartment={setDepartment}
            studentLevel={studentLevel}
            setStudentLevel={setStudentLevel}
            getResearchListings={getResearchListings}
            setResearchListings={setResearchListings}
            termsAvailable={termsAvailable}
            setTermsAvailable={setTermsAvailable}
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
