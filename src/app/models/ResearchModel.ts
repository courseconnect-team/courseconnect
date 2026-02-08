export interface ResearchListing {
  id: string;
  docID?: string;
  project_title: string;
  department: string;
  project_description: string;
  application_deadline: string;
  prerequisites: string;

  // New fields (target schema)
  faculty_contact?: string;
  phd_student_contact?: string;
  nature_of_job?: string;
  hours_per_week?: string;
  compensation?: string;
  image_url?: string;

  // Kept fields (still used in display)
  terms_available: string;
  student_level: string;
  application_requirements: string;
  website: string;

  // Legacy fields (kept optional for backward compatibility)
  faculty_mentor?: { [email: string]: string } | string;
  phd_student_mentor?: string | { [key: string]: string };
  credit?: string;
  stipend?: string;

  // System fields
  creator_id?: string;
  faculty_members?: string[];
  applications?: any[];
}

/**
 * Normalizes a raw Firestore document into the new ResearchListing shape,
 * deriving new fields from legacy fields when they are missing.
 */
export function normalizeResearchListing(raw: any): ResearchListing {
  const listing = { ...raw };

  // faculty_contact: derive from faculty_mentor if missing
  if (!listing.faculty_contact && listing.faculty_mentor) {
    if (typeof listing.faculty_mentor === 'object') {
      listing.faculty_contact = Object.keys(listing.faculty_mentor)[0] || '';
    } else if (typeof listing.faculty_mentor === 'string') {
      listing.faculty_contact = listing.faculty_mentor;
    }
  }

  // phd_student_contact: derive from phd_student_mentor if missing
  if (!listing.phd_student_contact && listing.phd_student_mentor) {
    if (typeof listing.phd_student_mentor === 'string') {
      listing.phd_student_contact = listing.phd_student_mentor;
    } else if (typeof listing.phd_student_mentor === 'object') {
      listing.phd_student_contact =
        Object.keys(listing.phd_student_mentor)[0] || '';
    }
  }

  // compensation: derive from credit + stipend if missing
  if (!listing.compensation) {
    const parts: string[] = [];
    if (listing.credit) parts.push(`${listing.credit} credits`);
    if (listing.stipend) parts.push(`$${listing.stipend}`);
    listing.compensation = parts.join(', ') || '';
  }

  // defaults for new fields
  listing.nature_of_job = listing.nature_of_job || '';
  listing.hours_per_week = listing.hours_per_week || '';
  listing.image_url = listing.image_url || '';
  listing.faculty_contact = listing.faculty_contact || '';
  listing.phd_student_contact = listing.phd_student_contact || '';

  return listing as ResearchListing;
}
