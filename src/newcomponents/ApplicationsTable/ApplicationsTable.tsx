// StatusTable.tsx – updated to use design-system colours from tailwind.config.js
import React from 'react';

/* Pill that reflects the four possible states */
function StatusPill({
  status,
}: {
  status: 'accepted' | 'rejected' | 'pending' | 'in-progress';
}) {
  const base =
    'inline-block px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap';
  switch (status) {
    case 'accepted':
      return (
        <span className={`${base} bg-status-approved text-on-status`}>
          Accepted
        </span>
      );
    case 'rejected':
      return (
        <span className={`${base} bg-status-error text-on-status`}>
          Rejected
        </span>
      );
    case 'in-progress':
      return (
        <span
          className={`${base} bg-surface text-on-surface border border-gray-300`}
        >
          In&nbsp;Progress
        </span>
      );
    default:
      return (
        <span className={`${base} bg-status-pending text-on-status`}>
          Pending
        </span>
      );
  }
}

interface StatusTableProps {
  assignments: string[];
  courses: Record<string, string> | null;
  adminDenied: boolean;
  position: string;
  dateApplied: string;
}

type Row = {
  application: string;
  position: string;
  submitted: string;
  status: 'accepted' | 'rejected' | 'pending' | 'in-progress';
};

export const StatusTable: React.FC<StatusTableProps> = ({
  assignments,
  courses,
  adminDenied,
  position,
  dateApplied
}) => {
  const rows: Row[] = [];

  /* accepted assignments */
  assignments.forEach((course) =>
    rows.push({
      application: course,
      position: position,
      submitted: dateApplied,
      status: 'accepted',
    })
  );

  /* per-course statuses */
  if (courses) {
    Object.entries(courses).forEach(([course, state]) => {
      let status: Row['status'] = 'pending';
      if (state === 'accepted') status = 'accepted';
      else if (state === 'denied') status = 'rejected';
      else if (state === 'applied') status = 'in-progress';
      rows.push({
        application: course,
        position: position,
        submitted: dateApplied,
        status,
      });
    });
  }

  /* whole application denied */
  if (adminDenied) rows.forEach((r) => (r.status = 'rejected'));

  return (
    <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
      <table className="min-w-full text-sm">
        {/* header */}
        <thead className="text-left text-xs font-semibold uppercase tracking-wider">
          <tr>
            {['Application', 'Position', 'Submitted', 'Status'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 !bg-primary-variant text-on-primary"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        {/* body */}
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 ? 'bg-surface' : 'bg-background'}>
              <td className="px-4 py-3 font-medium">{row.application}</td>
              <td className="px-4 py-3">{row.position}</td>
              <td className="px-4 py-3">{row.submitted}</td>
              <td className="px-4 py-3">
                <StatusPill status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
