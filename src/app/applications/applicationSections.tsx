/* components/DashboardSections.tsx */
import { Role } from '@/types/User';
import { useState } from 'react';
import { DashboardCard } from '@/components/DashboardCard/DashboardCard';
import { NavbarItem } from '@/types/navigation';
import SemesterSelect from '@/components/SemesterSelect/SemesterSelect';
import { useSemesterData } from '@/hooks/Courses/useSemesterData';
import { CoursesGrid } from '@/components/CoursesGrid/CoursesGrid';
import { type SemesterName } from '@/hooks/useSemesterOptions';
import SchoolIcon from '@mui/icons-material/School';
export default function ApplicationSections({
  role,
  navItems,
  uemail,
}: {
  role: Role;
  navItems: NavbarItem[];
  uemail: string;
}) {
  const [semester, setSemester] = useState<SemesterName | undefined>();
  const semesterArray = semester ? [semester] : undefined;
  const {
    currentSemester,
    options,
    courses,
    isLoading,
    isFetching,
    error,
    showSkeletons,
    skeletonCount,
  } = useSemesterData(role, uemail, semesterArray);

  switch (role) {
    case 'Student':
    case 'student_applied':
    case 'student_applying':
      return (
        <>
          <div className="mb-5">
            <h1 className="text-h6 mb-3 ">TA/UPI/Grader</h1>
            <div className="flex flex-wrap gap-6">
              {navItems
                .filter((item) => item.type === 'ta')
                .map(({ label, to, icon: Icon }: NavbarItem) => (
                  <DashboardCard key={to} icon={Icon} label={label} to={to} />
                ))}
            </div>
          </div>

          <div className="mb-5">
            <h1 className="text-h6 mb-3 ">Supervised Teaching</h1>
            <div className="flex flex-wrap gap-6">
              <DashboardCard
                key={'/applications/supervised-teaching'}
                icon={SchoolIcon}
                label={'Supervised Teaching'}
                to={'/applications/supervised-teaching'}
              />
            </div>
          </div>

          <div>
            <h1 className="text-h6 mb-3 ">Research</h1>
            <p className="text-sm">No available applications at this time.</p>
          </div>
        </>
      );

    case 'faculty':
    case 'admin':
      return (
        <>
          <div className="mb-5">
            <div className="text-h6 mb-3">TA/UPI/Grader </div>
            <SemesterSelect
              names={options}
              semester={semester}
              onChange={setSemester}
            />
            <CoursesGrid
              courses={courses}
              isLoading={isLoading}
              isFetching={isFetching}
              error={error}
              showSkeletons={showSkeletons}
              skeletonCount={skeletonCount}
              path={'applications'}
              semester={semesterArray}
            />
          </div>

          <div>
            <h1 className="text-h6 mb-3">Research</h1>
            <p className="text-sm">No available applications at this time.</p>
          </div>
        </>
      );

    default:
      return null; // or 404/unauthorised component
  }
}
