'use client';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useUserRole } from '@/firebase/util/GetUserRole';
import { JobCard } from '@/components/JobCard/JobCard';
interface ResearchPageProps {
  user: {
    uid: string;
    fullName: string;
    bio: string;
  };
}

const researchJobs = [
  {
    title:
      'Intelligent Natural Interaction Technology (INIT) Lab Research Assistant',
    department: 'Computer and Information Sciences and Engineering',
    faculty: 'Engineering',
    terms: ['Fall', 'Spring', 'Summer'],
    level: ['Freshman', 'Sophomore', 'Junior', 'Senior'],
    occupancy: 3,
    description:
      'Research focusing on advanced interaction technologies such as touch, gesture, voice, and mixed reality, in the context of human-AI interaction, education, healthcare, and serious games. Current priorities include designing intelligent chatbots for mobile health monitoring apps, digital AI assistants for novice users, and human-centered interactive machine learning interfaces.',
    mentor: 'Dr. Lisa Anthony',
    prereq:
      'Programming fundamentals, experimental design, data analysis preferred. Experience with children, good people skills, attention to detail, organization, and time management helpful.',
    credits: '0-3 via EGN 4912',
    stipend:
      'First semester: none (unless University Scholars), After trial: $15/hour up to 10 hours/week',
    requirements: 'Resume, UF unofficial transcripts, faculty interview',
    deadline:
      'Rolling basis (Recommended: Mar 15/July 1 for Fall, Nov 15 for Spring, Mar 15 for Summer)',
    website: 'http://init.cise.ufl.edu',
    contact: 'lanthony@cise.ufl.edu',
  },
  {
    title: 'Modeling Dialogue for Supporting Learning Research Assistant',
    department: 'Computer and Information Sciences and Engineering',
    faculty: 'Engineering',
    terms: ['Fall', 'Spring', 'Summer'],
    level: ['Freshman', 'Sophomore', 'Junior', 'Senior'],
    occupancy: 2,
    description:
      'Research focused on understanding and modeling dialogue for learning, building computational models of dialogue to support students through intelligent learning environments.',
    mentor: 'Dr. Kristy Boyer',
    prereq:
      'Java I and Java II strongly preferred. Data Structures recommended. High-achieving freshmen encouraged to apply.',
    credits: '0-3 via EGN 4912',
    stipend: '$10 per hour, flexible hours',
    requirements:
      'Resume, UF unofficial transcripts, faculty interview, cover letter',
    deadline: 'Rolling basis',
    website: 'https://www.cise.ufl.edu/research/learndialogue/',
    contact: 'timothy.brown@ufl.edu',
  },
];
const ResearchPage: React.FC<ResearchPageProps> = () => {
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',

          gap: '20px', // Space between cards
        }}
      >
        {role === 'faculty'}
        {researchJobs.map((job, index) => (
          <div
            key={index}
            style={{
              flex: '1 1 calc(50% - 20px)', // Adjusts for three cards per row
              maxWidth: 'calc(50% - 20px)',
            }}
          >
            <JobCard {...job} />
          </div>
        ))}
      </div>
    </>
  );
};

export default ResearchPage;
