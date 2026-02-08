/**
 * Research service for Firebase operations
 * Centralized CRUD operations for research listings and applications
 */
import { db } from './firebase';
import {
  ResearchListing,
  normalizeResearchListing,
} from '@/app/models/ResearchModel';

export interface ResearchFilters {
  department?: string;
  studentLevel?: string;
  termsAvailable?: string;
}

/**
 * Fetch research listings with optional filters
 * Uses optimized query pattern to avoid N+1 problem
 */
export async function fetchResearchListings(
  filters: ResearchFilters = {}
): Promise<ResearchListing[]> {
  try {
    // Build query with filters
    let query = db.collection('research-listings');

    if (filters.department) {
      query = query.where('department', '==', filters.department) as any;
    }

    if (filters.studentLevel) {
      query = query.where('student_level', '==', filters.studentLevel) as any;
    }

    // Fetch listings
    const snapshot = await query.get();
    const listingIds = snapshot.docs.map((doc) => doc.id);

    // Fetch all applications in a single query using collectionGroup
    const applicationsMap = new Map<string, any[]>();

    if (listingIds.length > 0) {
      const allApplicationsSnap = await db
        .collectionGroup('applications')
        .get();

      // Group applications by their parent listing ID
      allApplicationsSnap.docs.forEach((appDoc) => {
        const parentId = appDoc.ref.parent.parent?.id;
        if (parentId && listingIds.includes(parentId)) {
          if (!applicationsMap.has(parentId)) {
            applicationsMap.set(parentId, []);
          }
          applicationsMap.get(parentId)!.push({
            id: appDoc.id,
            ...appDoc.data(),
          });
        }
      });
    }

    // Map listings with their applications
    const listings: ResearchListing[] = snapshot.docs.map((doc) => {
      const apps = applicationsMap.get(doc.id) || [];
      return normalizeResearchListing({
        docID: doc.id,
        applications: apps,
        ...doc.data(),
      });
    });

    return listings;
  } catch (error) {
    console.error('Error fetching research listings:', error);
    throw new Error('Failed to fetch research listings');
  }
}

/**
 * Create a new research listing
 */
export async function createResearchListing(
  formData: Partial<ResearchListing>
): Promise<string> {
  try {
    const docRef = await db.collection('research-listings').add(formData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating research listing:', error);
    throw new Error('Failed to create research listing');
  }
}

/**
 * Update an existing research listing
 */
export async function updateResearchListing(
  listingId: string,
  updates: Partial<ResearchListing>
): Promise<void> {
  try {
    await db.collection('research-listings').doc(listingId).update(updates);
  } catch (error) {
    console.error('Error updating research listing:', error);
    throw new Error('Failed to update research listing');
  }
}

/**
 * Delete a research listing
 */
export async function deleteResearchListing(listingId: string): Promise<void> {
  try {
    // Delete the listing document
    await db.collection('research-listings').doc(listingId).delete();

    // Note: Applications subcollection will need to be deleted separately
    // if you want cascade delete behavior
  } catch (error) {
    console.error('Error deleting research listing:', error);
    throw new Error('Failed to delete research listing');
  }
}

/**
 * Fetch applications for a specific listing
 */
export async function fetchApplicationsForListing(
  listingId: string
): Promise<any[]> {
  try {
    const snapshot = await db
      .collection('research-listings')
      .doc(listingId)
      .collection('applications')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw new Error('Failed to fetch applications');
  }
}

/**
 * Submit an application to a research listing
 */
export async function submitApplication(
  listingId: string,
  applicationData: any
): Promise<string> {
  try {
    const docRef = await db
      .collection('research-listings')
      .doc(listingId)
      .collection('applications')
      .add(applicationData);

    return docRef.id;
  } catch (error) {
    console.error('Error submitting application:', error);
    throw new Error('Failed to submit application');
  }
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  listingId: string,
  applicationId: string,
  status: 'Pending' | 'Approved' | 'Denied'
): Promise<void> {
  try {
    await db
      .collection('research-listings')
      .doc(listingId)
      .collection('applications')
      .doc(applicationId)
      .update({ app_status: status });
  } catch (error) {
    console.error('Error updating application status:', error);
    throw new Error('Failed to update application status');
  }
}
