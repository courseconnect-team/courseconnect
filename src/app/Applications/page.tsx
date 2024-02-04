'use client';
import React from "react";
import { Toaster } from "react-hot-toast";
import ClassCard from "@/components/ClassCard/ClassCard";
import HeaderCard from "@/components/HeaderCard/HeaderCard";
import "./style.css";

export default function FacultyApplication (){
  return (
    <>
     <Toaster />
    
        <HeaderCard text = "Applications"/>
        
        <div className = "page-container">
          <div className="text-wrapper-11 ta">TA/UPI/Grader Applications</div>
          <div className="text-wrapper-11 courses">My courses:</div>
          </div>
          
          <div className="class-cards-container">
            <ClassCard courseName="COP3502C" className = "class"/>
            <ClassCard courseName="EEL3111C" className = "class"/>
            <ClassCard courseName="EEL3135" className = "class"/>
            <ClassCard courseName="COP3530" className = "class"/>
          </div>
    </>
  );
};
