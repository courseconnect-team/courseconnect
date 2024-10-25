import { FC, useEffect, useState } from 'react';
import FacultyApplication from '@/app/Applications/page';
import { getAuth } from 'firebase/auth';
import { useUserRole } from '@/firebase/util/GetUserRole';
import { useSearchParams } from 'next/navigation';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import FacultyDetails from '@/components/FacultyDetails/FacultyDetails';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { Timeline } from '@/components/Timeline/Timeline';
import SmallClassCard from '@/components/SmallClassCard/SmallClassCard';
import { FacultyStats } from '@/types/User';
import { useFacultyStats } from '@/hooks/useFacultyStats';
import { LinearProgress } from '@mui/material';

interface pageProps {
  params: { id: string };
}

interface CourseType {
  id: string;
  code: string;
  courseId: string;
}
const FacultyStatistics: FC<pageProps> = ({ params }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const searchParams = useSearchParams();
  const FacultyId = searchParams.get('id');
  const db = firebase.firestore();
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [pastCourses, setPastCourses] = useState<CourseType[]>([]);
  const {
    data: facultyStats,
    isLoading: statsLoading,
    error: statsError,
  } = useFacultyStats();
  const [facultyData, setFacultyData] = useState<FacultyStats | null>(null);

  const {
    role,
    loading: roleLoading,
    error: roleError,
  } = useUserRole(user?.uid);

  useEffect(() => {
    fetchPastCourses();
  }, [selectedYear]);

  const fetchPastCourses = async () => {
    const pastCourses = await getPastCourses(selectedYear);
    setPastCourses(pastCourses);
  };

  const getPastCourses = async (
    selectedYear: number
  ): Promise<CourseType[]> => {
    try {
      const currentYear = new Date().getFullYear();
      const year = currentYear - selectedYear;

      const springQuery = db
        .collection('past-courses')
        .where('semester', '==', `Spring ${year}`)
        .where('professor_emails', '==', uemail)
        .get();

      const fallQuery = db
        .collection('past-courses')
        .where('semester', '==', `Fall ${year}`)
        .where('professor_emails', '==', uemail)
        .get();

      const [springSnapshot, fallSnapshot] = await Promise.all([
        springQuery,
        fallQuery,
      ]);

      const courses: CourseType[] = [];

      const springFilter = springSnapshot.docs.filter(
        (doc) => doc.data().code !== null && doc.data().code !== undefined
      );
      springFilter.forEach((doc) => {
        courses.push({
          id: doc.id,
          code: doc.data().code,
          courseId: doc.data().class_number,
        });
      });

      const fallFilter = fallSnapshot.docs.filter(
        (doc) => doc.data().code !== null && doc.data().code !== undefined
      );

      fallFilter.forEach((doc) => {
        courses.push({
          id: doc.id,
          code: doc.data().code,
          courseId: doc.data().class_number,
        });
      });

      return courses;
    } catch (error) {
      console.error('Error getting courses:', error);
      alert('Error getting courses');
      return [];
    }
  };

  const getFacultyDetails = (FacultyId: string): FacultyStats | undefined => {
    return facultyStats?.find((stat) => stat.id === FacultyId);
  };

  useEffect(() => {
    if (FacultyId && facultyStats) {
      const result = getFacultyDetails(FacultyId);
      setFacultyData(result || null);
    }
  }, [FacultyId, facultyStats]);

  if (roleError) {
    return <p>Error loading role</p>;
  }

  if (!user) {
    return <p>Please sign in.</p>;
  }

  if (roleLoading || !role || role !== 'admin') {
    return <LinearProgress />;
  }

  if (statsLoading) {
    return <LinearProgress />;
  }

  if (statsError) {
    return <div>Error loading faculty statistics</div>;
  }

  // If facultyData is not found
  if (!facultyData) {
    return <p>Faculty member not found.</p>;
  }

  const mapElement = (courses: CourseType[]) => {
    return courses.map((val) => (
      <div key={val.id}>
        <SmallClassCard
          pathname={`/course/${encodeURIComponent(val.id)}`}
          courseName={val.code}
          courseId={val.id}
          className="class"
        />
      </div>
    ));
  };
  return (
    <>
      {facultyData && (
        <>
          <HeaderCard text="Faculty Statistics" />
          <div
            style={{
              marginTop: '380px',
            }}
          >
            <FacultyDetails
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
            >
              <Timeline
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
              {pastCourses.length !== 0 && (
                <div className="class-cards-container1">
                  {mapElement(pastCourses)}
                </div>
              )}
            </FacultyDetails>
          </div>
        </>
      )}
    </>
  );
};

export default FacultyStatistics;
