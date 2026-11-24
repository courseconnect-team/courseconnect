import React, { useMemo, useState } from 'react';
import ZoomInOutlinedIcon from '@mui/icons-material/ZoomInOutlined';
import ReviewModal from './ReviewModal';
import {
  useListingApplications,
  useUpdateListingApplicationStatus,
} from '@/hooks/Research/useListingApplications';
import { useApproveDenyConfirm } from '@/hooks/useApproveDenyConfirm';
import ApplicationStatusFilter from '@/components/ApplicationStatusFilter/ApplicationStatusFilter';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import { Pill, ApproveDeny } from '@/components/ApplicationsTable/ApplicationsTable';
import { StatusFilter } from '@/types/query';

interface FacultyApplicantsViewProps {
  id: string;
  researchListing: any;
  onBack: () => void;
}

const toUiStatus = (s?: string): 'approved' | 'denied' | 'in-progress' =>
  s === 'Approved' ? 'approved' : s === 'Denied' ? 'denied' : 'in-progress';

const applicantName = (a: any) =>
  `${a.firstname ?? ''} ${a.lastname ?? ''}`.trim() || a.email || 'Unknown';

const FacultyApplicantsView: React.FC<FacultyApplicantsViewProps> = ({
  id,
  researchListing,
  onBack,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [selected, setSelected] = useState<any | null>(null);

  const { data: applications = [], isLoading: loading } =
    useListingApplications(id);
  const { mutateAsync: setStatus } = useUpdateListingApplicationStatus(id);

  const confirm = useApproveDenyConfirm<any>((kind, app) =>
    setStatus({
      app,
      status: kind === 'approve' ? 'Approved' : 'Denied',
      projectTitle: researchListing?.project_title,
    })
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return applications;
    return applications.filter((a) => a.app_status === statusFilter);
  }, [applications, statusFilter]);

  return (
    <div className="w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-h6">{researchListing?.project_title}</h1>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#5A41D8] text-[#5A41D8] hover:bg-[#5A41D8]/5 hover:cursor-pointer"
        >
          Back to Research Listings
        </button>
      </div>

      <div className="mb-6">
        <ApplicationStatusFilter
          applicationState={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <div className="w-full max-w-full overflow-x-auto rounded-lg shadow-sm border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[#ECE6FF] text-left text-xs font-semibold tracking-wide">
              <th className="px-2 md:px-4 py-3 w-10"></th>
              <th className="px-2 md:px-4 py-3">Applicant Details</th>
              <th className="px-2 md:px-4 py-3">Submitted</th>
              <th className="px-2 md:px-4 py-3">Status</th>
              <th className="px-2 md:px-4 py-3">Faculty Approval</th>
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr
                  key={`sk-${i}`}
                  className={i % 2 ? 'bg-surface' : 'bg-background'}
                >
                  <td className="px-2 md:px-4 py-4">
                    <div className="h-5 w-5 rounded-full bg-gray-200" />
                  </td>
                  <td className="px-2 md:px-4 py-4">
                    <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-64 bg-gray-200 rounded" />
                  </td>
                  <td className="px-2 md:px-4 py-4">
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </td>
                  <td className="px-2 md:px-4 py-4">
                    <div className="h-6 w-28 bg-gray-200 rounded-full" />
                  </td>
                  <td className="px-2 md:px-4 py-4">
                    <div className="h-6 w-28 bg-gray-200 rounded-full" />
                  </td>
                </tr>
              ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  className="px-2 md:px-4 py-6 text-center text-sm text-muted-foreground"
                  colSpan={5}
                >
                  No applications for this position.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((app, idx) => {
                const zebra = idx % 2 ? 'bg-surface' : 'bg-background';
                return (
                  <tr
                    key={app.id}
                    className={`${zebra} border-t border-gray-100`}
                  >
                    <td className="px-2 md:px-4 py-3">
                      <button
                        aria-label="Inspect"
                        title="Open details"
                        onClick={() => setSelected(app)}
                        className="p-1.5 rounded-full hover:bg-gray-100 hover:cursor-pointer active:bg-gray-200"
                      >
                        <ZoomInOutlinedIcon fontSize="small" />
                      </button>
                    </td>

                    <td className="px-2 md:px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {applicantName(app)}
                        </span>
                      </div>
                    </td>

                    <td className="px-2 md:px-4 py-3">{app.date ?? 'MM/DD/YYYY'}</td>

                    <td className="px-2 md:px-4 py-3">
                      {app.app_status === 'Approved' ? (
                        <Pill variant="approved">Approved</Pill>
                      ) : app.app_status === 'Denied' ? (
                        <Pill variant="denied">Denied</Pill>
                      ) : (
                        <Pill variant="neutral">Applied</Pill>
                      )}
                    </td>

                    <td className="px-2 md:px-4 py-3">
                      <ApproveDeny
                        status={toUiStatus(app.app_status)}
                        onApprove={() =>
                          confirm.openConfirm('approve', app)
                        }
                        onDeny={() =>
                          confirm.openConfirm('deny', app)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.handleConfirm}
        loading={confirm.pending}
        title={
          confirm.kind === 'approve'
            ? `Approve ${confirm.target ? applicantName(confirm.target) : ''}?`
            : `Deny ${confirm.target ? applicantName(confirm.target) : ''}?`
        }
        description={
          confirm.kind === 'approve'
            ? `This will mark the application as approved for ${
                researchListing?.project_title ?? 'this position'
              }.`
            : 'This will mark the application as denied.'
        }
        confirmLabel={confirm.kind === 'approve' ? 'Approve' : 'Deny'}
        confirmColor={confirm.kind === 'approve' ? 'primary' : 'error'}
      />

      {/* Original research Review Application modal */}
      {selected && (
        <ReviewModal
          item={{
            ...selected,
            project_title: researchListing?.project_title,
            date_applied: selected.date,
          }}
          open
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default FacultyApplicantsView;
