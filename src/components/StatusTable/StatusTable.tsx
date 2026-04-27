// StatusTable.tsx – updated to use design-system colours from tailwind.config.js
import React from 'react';
import { useQueries } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import firebase from '@/firebase/firebase_config';
import { prettyCourseId } from '@/hooks/useSemesterOptions';

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

type CoursesShape =
  | Record<string, string>
  | Record<string, Record<string, string>>
  | null;

interface StatusTableProps {
  assignments: string[];
  courses: CoursesShape;
  adminApproved: boolean;
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

// Canonical shape is nested: { [semester]: { [courseId]: status } }.
// Legacy flat shape "<semester>|||<courseId>" -> status is split back out
// so pre-migration docs still render correctly.
function flattenCourses(
  courses: Exclude<CoursesShape, null>
): Array<{ courseId: string; semester: string; state: string }> {
  const out: Array<{ courseId: string; semester: string; state: string }> = [];
  for (const [key, value] of Object.entries(courses)) {
    if (value && typeof value === 'object') {
      for (const [courseId, state] of Object.entries(value)) {
        if (typeof state === 'string') {
          out.push({ courseId, semester: key, state });
        }
      }
    } else if (typeof value === 'string') {
      const sepIdx = key.indexOf('|||');
      if (sepIdx !== -1) {
        out.push({
          semester: key.slice(0, sepIdx),
          courseId: key.slice(sepIdx + 3),
          state: value,
        });
      } else {
        out.push({ semester: '', courseId: key, state: value });
      }
    }
  }
  return out;
}

async function fetchCourseInstructor(
  semester: string,
  courseId: string
): Promise<unknown> {
  if (!semester || !courseId) return undefined;
  const ref = doc(
    firebase.firestore(),
    'semesters',
    semester,
    'courses',
    courseId
  );
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data()?.professor_names : undefined;
}

export const StatusTable: React.FC<StatusTableProps> = ({
  assignments,
  courses,
  adminApproved,
  adminDenied,
  position,
  dateApplied,
}) => {
  const flattened = React.useMemo(
    () => (courses ? flattenCourses(courses) : []),
    [courses]
  );

  const instructorQueries = useQueries({
    queries: flattened.map(({ courseId, semester }) => ({
      queryKey: ['courseInstructor', semester, courseId],
      queryFn: () => fetchCourseInstructor(semester, courseId),
      enabled: Boolean(semester && courseId),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

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
  flattened.forEach(({ courseId, semester, state }, i) => {
    let status: Row['status'] = 'pending';
    if (state === 'approved' && adminApproved) status = 'accepted';
    else if (state === 'denied') status = 'rejected';
    else if (state === 'applied') status = 'in-progress';
    const pretty = prettyCourseId(courseId, instructorQueries[i]?.data);
    const label = semester ? `${pretty} (${semester})` : pretty;
    rows.push({
      application: label,
      position: position,
      submitted: dateApplied,
      status,
    });
  });

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
                className="px-4 py-3 !bg-primary-light text-on-background"
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
