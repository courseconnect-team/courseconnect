'use client';
import { FC, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import FacultyDetails from '@/component/FacultyDetails/FacultyDetails';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { FacultyStats } from '@/types/User';
// import { useFacultyStats } from '@/hooks/useFacultyStats';
import { Toaster } from 'react-hot-toast';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { isE2EMode } from '@/utils/featureFlags';
const FacultyStatistics: FC = () => {
  const [user, role, loading, error] = useUserInfo();
  const searchParams = useSearchParams();
  const FacultyId = searchParams.get('name');
  const db = firebase.firestore();

  // const [selectedYear, setSelectedYear] = useState<number>(1);
  // const {
  //   data: facultyStats,
  //   isLoading: statsLoading,
  //   error: statsError,
  // } = useFacultyStats();
  const [facultyData, setFacultyData] = useState<FacultyStats | null>(null);

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

  if (error) {
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

  return (
    <>
      <Toaster />
      <HeaderCard title="Faculty Statistics">
        <FacultyDetails
          instructor="Abdollahi Biron,Zoleikha"
          research_level="Low"
        />
      </HeaderCard>
    </>
  );
};

export default FacultyStatistics;
