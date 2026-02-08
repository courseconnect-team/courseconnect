/**
 * TypeScript interfaces for Research feature
 */

/**
 * Research application submitted by students
 */
export interface ResearchApplication {
  id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  app_status: 'Pending' | 'Approved' | 'Denied';
  gpa?: string;
  major?: string;
  year?: string;
  why_interested?: string;
  relevant_experience?: string;
  resume_url?: string;
  transcript_url?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

/**
 * Filter state for research listings
 */
export interface ResearchFilters {
  department?: string;
  studentLevel?: string;
  termsAvailable?: string;
  searchText?: string;
}

/**
 * Form data for creating/editing research listings
 */
export interface ResearchFormData {
  project_title: string;
  project_description: string;
  department: string;
  image_url: string;
  nature_of_job: string;
  compensation: string;
  faculty_contact: string;
  phd_student_contact: string;
  application_deadline: string;
  hours_per_week: string;
  prerequisites: string;
  terms_available: string;
  student_level: string;
  application_requirements: string;
  website: string;
}

/**
 * Props for StudentResearchView component
 */
export interface StudentResearchViewProps {
  researchListings: import('@/app/models/ResearchModel').ResearchListing[];
  role: string;
  uid: string;
  department: string;
  setDepartment: (dept: string) => void;
  studentLevel: string;
  setStudentLevel: (level: string) => void;
  getResearchListings: () => void;
  setResearchListings: (
    listings: import('@/app/models/ResearchModel').ResearchListing[]
  ) => void;
  termsAvailable: string;
  setTermsAvailable: (terms: string) => void;
}

/**
 * Props for FacultyResearchView component
 */
export interface FacultyResearchViewProps {
  researchListings: import('@/app/models/ResearchModel').ResearchListing[];
  role: string;
  uid: string;
  getResearchListings: () => void;
  postNewResearchPosition: (formData: ResearchFormData) => Promise<void>;
}

/**
 * Props for ProjectCard component
 */
export interface ProjectCardProps {
  listing: import('@/app/models/ResearchModel').ResearchListing;
  onEdit?: (
    listing: import('@/app/models/ResearchModel').ResearchListing
  ) => void;
  onShowApplications?: (
    listing: import('@/app/models/ResearchModel').ResearchListing
  ) => void;
  onDelete?: (listingId: string) => void;
}

/**
 * Props for ApplicationCard component
 */
export interface ApplicationCardProps {
  listing: import('@/app/models/ResearchModel').ResearchListing;
  uid: string;
  onApplySuccess?: () => void;
}

/**
 * Props for Modal components
 */
export interface ResearchModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  firebaseQuery: (formData: ResearchFormData) => Promise<void>;
  uid: string;
}

export interface EditResearchModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  listingData: import('@/app/models/ResearchModel').ResearchListing;
  uid: string;
}
