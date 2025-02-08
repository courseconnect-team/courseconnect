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
}
