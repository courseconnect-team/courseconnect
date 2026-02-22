export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  department: string;
  role: string;
  ufid: string;
  isNew: boolean;
  mode: 'view' | 'edit' | undefined;
}
export interface FacultyStats {
  id: string; // Firestore document ID
  instructor: string;
  research_level: string;
  isNew?: boolean;
}
export interface CourseType {
  id: string;
  code: string;
  courseId: string;
  semester?: string;
}
export type SelectSemester = {
  value: string;
  label: string;
};
export type Role =
  | 'Student'
  | 'admin'
  | 'faculty'
  | 'unapproved'
  | 'student_applying'
  | 'student_applied'
  | 'student_accepted'
  | 'student_denied';

export const roleMapping: Record<Role, string> = {
  Student: 'Student',
  admin: 'Admin',
  faculty: 'Faculty',
  unapproved: 'Unapproved',
  student_applying: 'Student',
  student_applied: 'Student',
  student_accepted: 'Student (Accepted)',
  student_denied: 'Student (Denied)',
};
