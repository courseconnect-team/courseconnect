import type { StatusTone } from '@/components/common/AdminDataTable';

export interface CoursePillSpec {
  label: string;
  tone: StatusTone;
}

/**
 * How one course on an application reads to an admin.
 *
 * Used by the assign dialog, which lists every course the applicant applied
 * for — not just faculty-approved ones (admin approval supersedes faculty, see
 * `handleOpenAssignmentDialog`). Without this the two are indistinguishable in
 * the list, and an admin can't tell whether a professor has actually signed off
 * on the course they're about to staff.
 */
export function courseStatusPill(status: string): CoursePillSpec {
  switch (status.trim().toLowerCase()) {
    case 'approved':
      return { label: 'Faculty approved', tone: 'success' };
    case 'accepted':
      return { label: 'Assigned', tone: 'brand' };
    case 'denied':
      return { label: 'Faculty denied', tone: 'danger' };
    default:
      return { label: 'Awaiting faculty', tone: 'warning' };
  }
}

/**
 * The faculty verdict on its own, for lists where "assigned" is already shown
 * some other way (a checked box). `null` means an assignment overwrote the
 * verdict before it was being recorded, so no claim can be made.
 */
export function facultyApprovalPill(
  facultyApproved: boolean | null
): CoursePillSpec {
  if (facultyApproved === true)
    return { label: 'Faculty approved', tone: 'success' };
  if (facultyApproved === false)
    return { label: 'No faculty approval', tone: 'warning' };
  return { label: 'Approval unknown', tone: 'neutral' };
}
