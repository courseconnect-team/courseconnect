import firebase from '@/firebase/firebase_config';
import type { CourseDetails } from '@/types/query';
import { useQuery } from '@tanstack/react-query';
// Generic Firestore fetch by id + flag
async function fetchCourse(
  courseId: string,
  onGoing: boolean
): Promise<CourseDetails | null> {
  const db = firebase.firestore();
 
  let snap =  await db.collection('courses').doc(courseId).get() ;

  if(!snap.exists){
    snap = await db.collection('past-courses').doc(courseId).get(); 
  }
  if (!snap.exists) return null;

  const data = snap.data()!;
  return {
    id: snap.id,
    courseName: data?.code || 'N/A',
    instructor: data?.professor_names || 'Unknown',
    email: data?.professor_emails || 'Unknown',
    studentsEnrolled:  data?.enrolled || 0,
    maxStudents: data.enrollment_cap ?? 0,
    courseCode: data.class_number ?? '',
    TAs: data?.tas || [],
    department: data?.department || 'Unknown',
    credits: data.credits ?? 0,
    semester: data?.semester || 'N/A',
    title: data?.title || 'N/A',
    meetingTimes: data?.meeting_times || 'N/A',
  } as CourseDetails;
}

export function useCourseDetails(courseId: string, onGoing: boolean = false) {
  const enabled = !!courseId;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['courseDetails', courseId],
    queryFn: () => fetchCourse(courseId, onGoing),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return {
    course: data,
    isLoading,
    isFetching,
    error,
  }
}
