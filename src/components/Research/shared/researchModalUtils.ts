/**
 * Shared utilities and constants for Research modal components
 */
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { NATURE_OF_JOB_OPTIONS } from '@/constants/research';

// Re-export constants for backward compatibility
export { NATURE_OF_JOB_OPTIONS };

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

export const INITIAL_FORM_DATA: ResearchFormData = {
  project_title: '',
  project_description: '',
  department: '',
  image_url: '',
  nature_of_job: '',
  compensation: '',
  faculty_contact: '',
  phd_student_contact: '',
  application_deadline: '',
  hours_per_week: '',
  prerequisites: '',
  terms_available: '',
  student_level: '',
  application_requirements: '',
  website: '',
};

/**
 * Upload an image file to Firebase Storage
 * @param file - The image file to upload
 * @returns The download URL of the uploaded image
 */
export async function uploadResearchImage(file: File): Promise<string> {
  const storage = getStorage();
  const storageRef = ref(storage, `research-images/${uuidv4()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Validate research form data
 * @param formData - The form data to validate
 * @returns An object with error messages for each field, or empty if valid
 */
export function validateResearchForm(
  formData: ResearchFormData
): Partial<Record<keyof ResearchFormData, string>> {
  const errors: Partial<Record<keyof ResearchFormData, string>> = {};

  if (!formData.project_title.trim()) {
    errors.project_title = 'Required';
  }
  if (!formData.project_description.trim()) {
    errors.project_description = 'Required';
  }
  if (!formData.department.trim()) {
    errors.department = 'Required';
  }
  if (!formData.nature_of_job) {
    errors.nature_of_job = 'Required';
  }
  if (!formData.compensation.trim()) {
    errors.compensation = 'Required';
  }
  if (!formData.faculty_contact.trim()) {
    errors.faculty_contact = 'Required';
  }
  if (!formData.application_deadline.trim()) {
    errors.application_deadline = 'Required';
  }
  if (!formData.hours_per_week.trim()) {
    errors.hours_per_week = 'Required';
  }

  return errors;
}

/**
 * Check if form data is valid
 * @param formData - The form data to check
 * @returns true if valid, false otherwise
 */
export function isFormValid(formData: ResearchFormData): boolean {
  const errors = validateResearchForm(formData);
  return Object.keys(errors).length === 0;
}
