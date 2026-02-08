/**
 * Research-related constants for CourseConnect
 */

// Nature of job options for research positions
export const NATURE_OF_JOB_OPTIONS = [
  'Research Assistant',
  'Lab Assistant',
  'Teaching Assistant',
  'Field Work',
  'Data Analysis',
  'Other',
] as const;

// Department options
export const DEPARTMENTS = [
  {
    value: 'Computer and Information Sciences and Engineering',
    label: 'CISE',
    fullName: 'Computer and Information Sciences and Engineering',
  },
  {
    value: 'Electrical and Computer Engineering',
    label: 'ECE',
    fullName: 'Electrical and Computer Engineering',
  },
  {
    value: 'Engineering Education',
    label: 'Education',
    fullName: 'Engineering Education',
  },
  {
    value: 'Materials Science and Engineering',
    label: 'MSE',
    fullName: 'Materials Science and Engineering',
  },
  {
    value: 'Mechanical and Aerospace Engineering',
    label: 'MAE',
    fullName: 'Mechanical and Aerospace Engineering',
  },
  {
    value: 'Civil and Coastal Engineering',
    label: 'CCE',
    fullName: 'Civil and Coastal Engineering',
  },
  {
    value: 'Chemical Engineering',
    label: 'ChemE',
    fullName: 'Chemical Engineering',
  },
  {
    value: 'Biomedical Engineering',
    label: 'BME',
    fullName: 'Biomedical Engineering',
  },
  {
    value: 'Industrial and Systems Engineering',
    label: 'ISE',
    fullName: 'Industrial and Systems Engineering',
  },
  {
    value: 'Environmental Engineering Sciences',
    label: 'EES',
    fullName: 'Environmental Engineering Sciences',
  },
] as const;

// Student level options
export const STUDENT_LEVELS = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate',
] as const;

// Academic terms (update annually)
export const TERMS = [
  'Spring 2026',
  'Summer 2026',
  'Fall 2026',
  'Spring 2027',
  'Summer 2027',
  'Fall 2027',
] as const;

// Application status options
export const APPLICATION_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DENIED: 'Denied',
} as const;

// Helper function to get department full name
export function getDepartmentFullName(value: string): string {
  const dept = DEPARTMENTS.find((d) => d.value === value);
  return dept?.fullName || value;
}

// Helper function to get department label
export function getDepartmentLabel(value: string): string {
  const dept = DEPARTMENTS.find((d) => d.value === value);
  return dept?.label || value;
}

// Helper function to check if a department matches (handles naming variations)
export function isDepartmentMatch(
  department: string,
  searchTerm: string
): boolean {
  const normalized = searchTerm.toLowerCase().trim();
  const deptNormalized = department.toLowerCase().trim();

  // Direct match
  if (deptNormalized === normalized) return true;

  // Check for common variations
  if (
    department === 'Computer and Information Sciences and Engineering' ||
    department === 'Computer and Information Science and Engineering'
  ) {
    return (
      normalized === 'computer and information science and engineering' ||
      normalized === 'computer and information sciences and engineering' ||
      normalized === 'cise'
    );
  }

  return false;
}
