// components/CourseApplicationsTable.tsx
import * as React from 'react';
import ZoomInOutlinedIcon from '@mui/icons-material/ZoomInOutlined';
import Link from 'next/link';
import { AppRow } from '@/types/query';
import {
  denyApplication,
  approveApplication,
} from '@/app/applications/[className]/ApplicationFunctions';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
type AdminStatus = 'approved' | 'pending' | 'denied';

export type UIRow = {
  id: string;
  applicantName: string;
  submitted: string;
  appStatus: 'approved' | 'denied' | 'pending' | 'in-progress' | 'assigned';
  adminStatus: AdminStatus;
  uf_email: string;
  position: string;
};

function Pill({
  variant,
  children,
}: {
  variant: 'approved' | 'denied' | 'pending' | 'neutral';
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    approved: 'bg-status-approved text-on-status',
    denied: 'bg-status-error text-on-status',
    pending: 'bg-status-pending text-on-status',
    neutral: 'bg-surface text-on-surface border border-gray-300',
  };
  return (
    <span
      className={`inline-block px-5  py-1 rounded-lg text-xs font-semibold  ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function ApproveDeny({
  onApprove,
  onDeny,
}: {
  onApprove: () => void;
  onDeny: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onApprove}
        className="px-3 py-1 rounded-lg text-xs font-semibold border transition
                   bg-status-approvedLt text-status-approved border-status-approved
                 hover:bg-status-approved hover:cursor-pointer hover:text-on-primary"
      >
        Approve
      </button>
      <button
        onClick={onDeny}
        className="px-5 py-1 rounded-lg text-xs font-semibold border transition
                   bg-status-errorLt text-status-error border-status-error hover:bg-status-error hover:cursor-pointer  hover:text-on-primary"
      >
        Deny
      </button>
    </div>
  );
}

/** Map raw AppRow → UIRow (defensive about fields). */
function mapToUI(
  r: AppRow,
  getAdminStatus?: (r: AppRow) => AdminStatus
): UIRow {
  const d = r.data ?? {};
  const first = d.firstname ?? '';
  const last = d.lastname ?? '';
  const applicantName = d.name ?? `${first} ${last}`.trim();
  const submitted = d.date ?? 'MM/DD/YYYY';
  const uf_email = d.email;
  const position = d.position;
  // appStatus mapping for UI
  let appStatus: UIRow['appStatus'];
  switch (r.status) {
    case 'approved':
      appStatus = 'approved';
      break;
    case 'denied':
    case 'Admin_denied':
      appStatus = 'denied';
      break;
    case 'assigned':
      appStatus = 'assigned';
      break;
    case 'applied':
    default:
      appStatus = 'in-progress';
  }

  // adminStatus: from helper if provided; otherwise derive simple default

  const adminStatus =
    getAdminStatus?.(r) ??
    (d.status === 'Admin_approved'
      ? 'approved'
      : d.status === 'Admin_denied'
      ? 'denied'
      : 'pending');

  return {
    id: r.id,
    applicantName,
    submitted,
    appStatus,
    adminStatus,
    uf_email,
    position,
  };
}

/* ===================== PRESENTATIONAL TABLE ===================== */

export interface CourseApplicationsTableProps {
  rows: AppRow[]; // from your API/hook for ONE course
  openInNewTab?: boolean;
  getAdminStatus?: (row: AppRow) => AdminStatus; // optional if you compute admin status elsewhere
  loading?: boolean; // optional skeleton state
  emptyMessage?: string;
  courseId: string;
}

export const CourseApplicationsTable: React.FC<
  CourseApplicationsTableProps
> = ({
  rows,
  openInNewTab = false,
  getAdminStatus,
  loading = false,
  emptyMessage = 'No applications for this course.',
  courseId,
}) => {
  const [confirm, setConfirm] = React.useState<{
    open: boolean;
    kind: 'approve' | 'deny' | null;
    row?: UIRow;
  }>({ open: false, kind: null });

  const [pending, setPending] = React.useState(false);

  const openConfirm = (kind: 'approve' | 'deny', row: UIRow) =>
    setConfirm({ open: true, kind, row });

  const closeConfirm = () =>
    setConfirm({ open: false, kind: null, row: undefined });

  const handleConfirm = async () => {
    if (!confirm.row) return;
    try {
      setPending(true);
      if (confirm.kind === 'approve') {
        await approveApplication({
          documentId: confirm.row.id,
          classCode: courseId,
        });
      } else {
        await denyApplication({
          documentId: confirm.row.id,
          classCode: courseId,
          name: confirm.row.applicantName,
          uf_email: confirm.row.uf_email,
          position: confirm.row.position,
        });
      }
      closeConfirm();
      // Optional: trigger a refetch or optimistic UI update here
    } catch (e) {
      console.error(e);
    } finally {
      setPending(false);
    }
  };

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const uiRows: UIRow[] = rows.map((r) => mapToUI(r, getAdminStatus));

  return (
    <>
      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
        <table className="min-w-full text-sm">
          {/* header */}
          <thead>
            <tr className="bg-[#ECE6FF] text-left text-xs font-semibold tracking-wide">
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">Applicant Details</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Admin Approval</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={`sk-${i}`}
                    className={i % 2 ? 'bg-surface' : 'bg-background'}
                  >
                    <td className="px-4 py-4">
                      <div className="h-5 w-5 rounded-full bg-gray-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-64 bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-28 bg-gray-200 rounded-full" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-28 bg-gray-200 rounded-full" />
                    </td>
                  </tr>
                ))}
              </>
            )}

            {!loading && uiRows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                  colSpan={5}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!loading &&
              uiRows.map((ui, idx) => {
                const raw = rows[idx]; // keep 1:1 mapping
                const zebra = idx % 2 ? 'bg-surface' : 'bg-background';

                return (
                  <tr
                    key={ui.id}
                    className={`${zebra} border-t border-gray-100`}
                  >
                    {/* magnifier */}
                    <td className="px-4 py-3">
                      <Link
                        href={{
                          pathname: `/applications/${courseId}`,
                          query: { id: ui.id, modal: '1' },
                        }}
                        scroll={false} // avoid scroll jump
                        prefetch
                      >
                        <button
                          aria-label="Inspect"
                          className="p-1.5 rounded-full hover:bg-gray-100 hover:cursor-pointer active:bg-gray-200"
                          title="Open details"
                        >
                          <ZoomInOutlinedIcon fontSize="small" />
                        </button>
                      </Link>
                    </td>

                    {/* applicant */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{ui.applicantName}</span>
                        {/* If you want to show email or student id, add here from raw.data */}
                      </div>
                    </td>

                    {/* submitted */}
                    <td className="px-4 py-3">{ui.submitted}</td>

                    {/* status */}
                    <td className="px-4 py-3">
                      {ui.adminStatus === 'denied' ||
                      ui.appStatus === 'denied' ? (
                        <Pill variant="denied">Denied</Pill>
                      ) : ui.appStatus === 'approved' ||
                        ui.appStatus === 'assigned' ? (
                        <Pill variant="approved">
                          {ui.appStatus === 'assigned'
                            ? 'Assigned'
                            : 'Approved'}
                        </Pill>
                      ) : (
                        <ApproveDeny
                          onApprove={() => openConfirm('approve', ui)}
                          onDeny={() => openConfirm('deny', ui)}
                        />
                      )}
                    </td>

                    {/* admin approval */}
                    <td className="px-4 py-3">
                      {ui.adminStatus === 'approved' ? (
                        <Pill variant="approved">Approved</Pill>
                      ) : ui.adminStatus === 'denied' ? (
                        <Pill variant="denied">Denied</Pill>
                      ) : (
                        <Pill variant="pending">Pending</Pill>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={confirm.open}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        loading={pending}
        title={
          confirm.kind === 'approve'
            ? `Approve ${confirm.row?.applicantName}?`
            : `Deny ${confirm.row?.applicantName}?`
        }
        description={
          confirm.kind === 'approve'
            ? `This will mark the application as approved for ${courseId}.`
            : `This will mark the application as denied and notify the applicant.`
        }
        confirmLabel={confirm.kind === 'approve' ? 'Approve' : 'Deny'}
        confirmColor={confirm.kind === 'approve' ? 'primary' : 'error'}
      />

      {/* optional overlay viewer */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl h-[70vh] rounded-xl shadow-2xl overflow-hidden relative">
            <button
              className="absolute top-2 right-2 rounded px-3 py-1 text-xs bg-gray-900 text-white hover:opacity-90"
              onClick={() => setPreviewUrl(null)}
            >
              Close
            </button>
            <iframe src={previewUrl} className="w-full h-full" />
          </div>
        </div>
      )}
    </>
  );
};
