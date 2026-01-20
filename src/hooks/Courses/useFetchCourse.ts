import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import type { CourseDetails } from '@/types/query';
import { useQuery } from '@tanstack/react-query';
import { SemesterName } from '../useSemesterOptions';

// Generic Firestore fetch by id + flag
async function fetchCourse(
  courseId: string,
  semester: SemesterName,
  onGoing: boolean
): Promise<CourseDetails | null> {
  const db = firebase.firestore();

  const ref = db
    .collection('semesters')
    .doc(semester)
    .collection('courses')
    .doc(courseId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  return {
    id: snap.id,
    courseName: data?.code || 'N/A',
    instructor: data?.professor_names || 'Unknown',
    email: data?.professor_emails || 'Unknown',
    studentsEnrolled: data?.enrolled || 0,
    maxStudents: data.enrollment_cap ?? 0,
    courseCode: data.class_number ?? '',
    TAs: data?.tas || [],
    department: data?.department || 'Unknown',
    credits: data.credits ?? 0,
    semester,
    title: data?.title || 'N/A',
    meetingTimes: data?.meeting_times || 'N/A',
  } as CourseDetails;
}

export function useCourseDetails(
  courseId: string,
  semester: SemesterName,
  onGoing: boolean = false
) {
  const enabled = !!courseId;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['courseDetails', semester, courseId],
    queryFn: () => fetchCourse(courseId, semester, onGoing),
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
  };
}
