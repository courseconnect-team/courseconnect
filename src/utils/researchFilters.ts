/**
 * Filter utilities for Research listings
 * Extracted from StudentResearchView for reusability and testing
 */
import { ResearchListing } from '@/app/models/ResearchModel';
import { isDepartmentMatch } from '@/constants/research';

/**
 * Filter research listings by search text
 * Searches in project title, description, and faculty contact
 */
export function filterBySearchText(
  listings: ResearchListing[],
  searchText: string
): ResearchListing[] {
  if (!searchText.trim()) return listings;

  const searchLower = searchText.toLowerCase().trim();

  return listings.filter((listing) => {
    const title = (listing.project_title || '').toLowerCase();
    const description = (listing.project_description || '').toLowerCase();
    const faculty = (listing.faculty_contact || '').toLowerCase();

    return (
      title.includes(searchLower) ||
      description.includes(searchLower) ||
      faculty.includes(searchLower)
    );
  });
}

/**
 * Filter research listings by department
 * Handles department name variations
 */
export function filterByDepartment(
  listings: ResearchListing[],
  department: string
): ResearchListing[] {
  if (!department.trim()) return listings;

  return listings.filter((listing) => {
    return isDepartmentMatch(listing.department, department);
  });
}

/**
 * Filter research listings by terms available
 */
export function filterByTerms(
  listings: ResearchListing[],
  terms: string
): ResearchListing[] {
  if (!terms.trim()) return listings;

  const termsLower = terms.toLowerCase().trim();

  return listings.filter((listing) => {
    const listingTerms = (listing.terms_available || '').toLowerCase();
    return listingTerms.includes(termsLower);
  });
}

/**
 * Filter research listings by student level
 */
export function filterByStudentLevel(
  listings: ResearchListing[],
  studentLevel: string
): ResearchListing[] {
  if (!studentLevel.trim()) return listings;

  const levelLower = studentLevel.toLowerCase().trim();

  return listings.filter((listing) => {
    const listingLevel = (listing.student_level || '').toLowerCase();
    return listingLevel.includes(levelLower);
  });
}

/**
 * Apply all filters to research listings
 * This is the main entry point for filtering
 */
export function applyAllFilters(
  listings: ResearchListing[],
  filters: {
    searchText?: string;
    department?: string;
    terms?: string;
    studentLevel?: string;
  }
): ResearchListing[] {
  let filtered = listings;

  if (filters.searchText) {
    filtered = filterBySearchText(filtered, filters.searchText);
  }

  if (filters.department) {
    filtered = filterByDepartment(filtered, filters.department);
  }

  if (filters.terms) {
    filtered = filterByTerms(filtered, filters.terms);
  }

  if (filters.studentLevel) {
    filtered = filterByStudentLevel(filtered, filters.studentLevel);
  }

  return filtered;
}

/**
 * Sort research listings by application deadline (earliest first)
 */
export function sortByDeadline(listings: ResearchListing[]): ResearchListing[] {
  return [...listings].sort((a, b) => {
    const dateA = new Date(a.application_deadline).getTime();
    const dateB = new Date(b.application_deadline).getTime();
    return dateA - dateB;
  });
}

/**
 * Sort research listings by creation date (newest first)
 */
export function sortByNewest(listings: ResearchListing[]): ResearchListing[] {
  return [...listings].sort((a, b) => {
    // Assuming docID contains timestamp info or we have a created_at field
    // For now, just maintain original order
    return 0;
  });
}
