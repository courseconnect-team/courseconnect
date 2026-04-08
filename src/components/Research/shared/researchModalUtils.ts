/**
 * Shared utilities and constants for Research modal components
 */
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
 * Convert an image file to a base64 data URL.
 * The returned string can be stored directly in Firestore and used as an img src.
 * Images are resized to a max of 800px wide to stay within Firestore's 1 MB document limit.
 */
export async function uploadResearchImage(file: File): Promise<string> {
  const MAX_WIDTH = 800;
  const QUALITY = 0.7;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', QUALITY);
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
