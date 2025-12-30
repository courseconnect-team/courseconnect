'use client';
import { FC, useEffect, useState } from 'react';
import FacultyApplication from '@/app/Applications/page';
import { getAuth } from 'firebase/auth';
import { useUserRole } from '@/firebase/util/GetUserRole';
import { useSearchParams } from 'next/navigation';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import FacultyDetails from '@/component/FacultyDetails/FacultyDetails';
import HeaderCard from '@/component/HeaderCard/HeaderCard';
import SmallClassCard from '@/component/SmallClassCard/SmallClassCard';
import { FacultyStats } from '@/types/User';
// import { useFacultyStats } from '@/hooks/useFacultyStats';
import { LinearProgress } from '@mui/material';
import { CourseType } from '@/types/User';
import useFetchPastCourses from '@/hooks/old/usePastCourses';
import { Toaster } from 'react-hot-toast';

interface pageProps {
  params: { name: string };
}

const FacultyStatistics: FC<pageProps> = ({ params }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const searchParams = useSearchParams();
  const FacultyId = searchParams.get('name');
  console.log(FacultyId);
  const db = firebase.firestore();
  // const [selectedYear, setSelectedYear] = useState<number>(1);
  // const {
  //   data: facultyStats,
  //   isLoading: statsLoading,
  //   error: statsError,
  // } = useFacultyStats();
  const [facultyData, setFacultyData] = useState<FacultyStats | null>(null);

  const {
    role,
    loading: roleLoading,
    error: roleError,
  } = useUserRole(user?.uid);

  // const getFacultyDetails = (FacultyId: string): FacultyStats | undefined => {
  //   return FacultyId in facultyStats! ? facultyStats![FacultyId] : undefined;
  // };
  // const { pastCourses, loadingPast, error } = useFetchPastCourses(
  //   selectedYear,
  //   facultyData?.email
  // );

  // useEffect(() => {
  //   if (FacultyId && facultyStats) {
  //     const result = getFacultyDetails(FacultyId);
  //     setFacultyData(result || null);
  //   }
  // }, [FacultyId, facultyStats]);

  if (roleError) {
    return <p>Error loading role</p>;
  }

  if (!user) {
    return <p>Please sign in.</p>;
  }

  // if (roleLoading || !role || role !== 'admin') {
  //   return <LinearProgress />;
  // }

  // if (statsLoading) {
  //   return <LinearProgress />;
  // }

  // if (statsError) {
  //   return <div>Error loading faculty statistics</div>;
  // }

  // If facultyData is not found
  // if (!facultyData) {
  //   return <p>Faculty member not found.</p>;
  // }

  // const mapElement = (courses: CourseType[]) => {
  //   return courses.map((val) => (
  //     <div key={val.id}>
  //       <SmallClassCard
  //         pathname={`/course/${encodeURIComponent(val.id)}`}
  //         courseName={val.code}
  //         courseId={val.id}
  //         className="class"
  //         onGoing={undefined}
  //       />
  //     </div>
  //   ));
  // };
  if (role !== 'admin') return <div> Forbidden </div>;

  console.log(facultyData);
  return (
    <>
      <Toaster />
      <HeaderCard text="Faculty Statistics" />

      {/* <FacultyDetails
              firstname={facultyData.firstname}
              lastname={facultyData.lastname}
              email={facultyData.email}
              ufid={facultyData.ufid}
              accumulatedUnits={facultyData.accumulatedUnits}
              assignedUnits={facultyData.assignedUnits}
              averageUnits={facultyData.averageUnits}
              creditDeficit={facultyData.creditDeficit}
              creditExcess={facultyData.creditExcess}
              classesTaught={facultyData.classesTaught}
              researchActivity={facultyData.researchActivity}
              labCourse={facultyData.labCourse}
              id={''}
            > */}
      <FacultyDetails
        instructor="Abdollahi Biron,Zoleikha"
        research_level="Low"
      />
    </>
  );
};

export default FacultyStatistics;
