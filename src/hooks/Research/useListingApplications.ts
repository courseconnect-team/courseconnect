import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchApplicationsForListing,
  updateApplicationStatus,
} from '@/services/researchService';
import { callFunction } from '@/firebase/functions/callFunction';

export type ResearchStatus = 'Pending' | 'Approved' | 'Denied';

export const listingApplicationsKey = (listingId: string) =>
  ['researchListingApplications', listingId] as const;

/** Applications stored under research-listings/{listingId}/applications. */
export const useListingApplications = (listingId: string) =>
  useQuery<any[]>({
    queryKey: listingApplicationsKey(listingId),
    queryFn: () => fetchApplicationsForListing(listingId),
    enabled: !!listingId,
  });

type UpdateStatusVars = {
  app: any;
  status: ResearchStatus;
  projectTitle?: string;
};

/** Best-effort decision email; a failure here never blocks the status change. */
async function sendDecisionEmail(
  app: any,
  status: 'Approved' | 'Denied',
  projectTitle?: string
) {
  if (!app.email || !projectTitle) return;
  try {
    await callFunction('sendEmail', {
      type: 'sendStatusUpdateToApplicant',
      data: {
        user: {
          name: `${app.firstname ?? ''} ${app.lastname ?? ''}`.trim(),
          email: app.email,
        },
        project_title: projectTitle,
        status,
      },
    });
  } catch (err) {
    console.error(`Failed to send research ${status} email:`, err);
  }
}

/**
 * Sets app_status on one application and patches the cached list.
 * Approvals and denials also email the applicant.
 */
export const useUpdateListingApplicationStatus = (listingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ app, status, projectTitle }: UpdateStatusVars) => {
      await updateApplicationStatus(listingId, app.id, status);
      if (status !== 'Pending')
        await sendDecisionEmail(app, status, projectTitle);
    },
    onSuccess: (_, { app, status }) =>
      queryClient.setQueryData<any[]>(listingApplicationsKey(listingId), (old) =>
        old?.map((a) => (a.id === app.id ? { ...a, app_status: status } : a))
      ),
  });
};
