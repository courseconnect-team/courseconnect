interface TA {
  name: string;
  email: string;
}

interface Schedule {
  day: string;
  location: string;
  time: string;
}

export interface CourseDetails {
  id: string;
  courseName: string;
  instructor: string;
  email: string;
  studentsEnrolled: number;
  maxStudents: number;
  courseCode: string;
  TAs: TA[];
  department: string;
  credits: number;
  semester: string;
  title: string;
  meetingTimes: Schedule[];
}

export type Position = 'TA' | 'UPI' | 'Grader';


export type Status = 
  "applied" | "Assigned" | "Admin_approved" | "Admin_denied" | "denied" | "accepted"
