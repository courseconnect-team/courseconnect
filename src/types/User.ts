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
  accumulatedUnits: number;
  assignedUnits: number;
  averageUnits: number;
  creditDeficit: number;
  creditExcess: number;
  email: string;
  firstname: string;
  labCourse: boolean;
  lastname: string;
  researchActivity: string;
  classesTaught: number;
  ufid: number; // Assuming ufid is a number based on the sample value
  isNew?: boolean; // Optional, used for UI state
  mode?: 'view' | 'edit'; // Optional, used for UI state
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
