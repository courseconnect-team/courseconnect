'use client';
import './style.css';
import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import SemesterSelect from "./semesterselect";
import ClassCard from "@/components/ClassCard/ClassCard";
import HeaderCard from "@/components/HeaderCard/HeaderCard";
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function FacultyApplication() {
  const auth = getAuth();
  const [semester, setSemester] = useState("Fall 2022");
  const [courses, setCourses] = useState<string[]>([]);
  const db = firebase.firestore();

  // Reactively listen to auth state changes
  const user = auth.currentUser;
  const uemail = user?.email;
   
  const formatSeasonYear = (sem: string):string => {
    const parts = sem.split(' '); 
    const season = parts[0].toLowerCase(); 
    const yearShort = parts[1].substring(2); 
    return `${season}${yearShort}`; 
};

  const getCourses = async (semester: string) => {
    try {
      semester = formatSeasonYear(semester);
      const snapshot = await db
      .collection(`courses-${semester}`)
      .where('professor_emails', 'array-contains', uemail) // Check if the current user is the instructor
      .get();

      const filteredDocs = snapshot.docs.filter(doc => doc.data().code !== null && doc.data().code !== undefined);
      
      return filteredDocs.map(doc => doc.data().code);

    } catch (error) {
      console.error(`Error getting courses:`, error);
      alert("Error getting courses:")
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getCourses(semester)
        setCourses(result);
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };

    fetchData();
  }, [semester]);

  const mapElement = () => {
    return courses.map((course) =>{
      return(
       <div key = {course}>
       <ClassCard courseName= {course} className = "class"/>
       </div>
      );
    });
  }
  return (
    <>
     <Toaster />
    
        <HeaderCard text = "Applications"/> 
        <div className = "page-container">
          <div className="text-wrapper-11 ta">TA/UPI/Grader Applications</div>
          <div style={{display: "flex", justifyContent: "space-between"}}>
          <div className="text-wrapper-11 courses">My courses:</div>
          <div style={{marginRight: "35px"}}>
            <SemesterSelect semester = {semester} setSemester={setSemester}></SemesterSelect>
          </div>
          </div>
        </div>
        {courses.length !== 0 && (
          <div className="class-cards-container">
          {mapElement()}
          </div>
        )}
        {courses.length === 0 && (
          
          <div style={{marginTop: "162px",marginLeft: "227px", marginRight: "227px",textAlign: 'center', color: 'rgba(0, 0, 0, 0.43)', fontSize: 24, fontFamily: 'SF Pro Display', fontWeight: '500'}}>Currently, no courses have been assigned to you yet. Please wait until an admin assigns your courses. Once your courses are assigned, you'll be able to access applicants for those classes.</div>
        )}
    </>
  );
};
