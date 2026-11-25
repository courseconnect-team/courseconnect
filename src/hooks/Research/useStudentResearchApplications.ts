import { useQuery } from '@tanstack/react-query';
import firebase from '@/firebase/firebase_config';

export type StudentResearchApplication = {
  id: string;
  listingId: string;
  projectTitle: string;
  dateApplied: string;
  status: 'Pending' | 'Approved' | 'Denied' | string;
};

async function fetchStudentResearchApplications(
  uid: string
): Promise<StudentResearchApplication[]> {
  const snapshot = await firebase
    .firestore()
    .collectionGroup('applications')
    .where('uid', '==', uid)
    .get();

  const researchDocs = snapshot.docs.filter(
    (d) => d.ref.parent.parent?.parent.id === 'research-listings'
  );

  return Promise.all(
    researchDocs.map(async (appDoc) => {
      const app = appDoc.data();
      const listingRef = appDoc.ref.parent.parent!;
      const listing = (await listingRef.get()).data() ?? {};
      return {
        id: appDoc.id,
        listingId: listingRef.id,
        projectTitle: listing.project_title || 'Research position',
        dateApplied: app.date || 'N/A',
        status: app.app_status || 'Pending',
      };
    })
  );
}

/** The signed-in student's applications across all research listings. */
export const useStudentResearchApplications = (uid?: string) =>
  useQuery({
    queryKey: ['studentResearchApplications', uid],
    queryFn: () => fetchStudentResearchApplications(uid!),
    enabled: !!uid,
  });
