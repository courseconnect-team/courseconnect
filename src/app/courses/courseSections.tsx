/* components/DashboardSections.tsx */
import { useSemesterData } from '@/hooks/Courses/useSemesterData';
import SemesterSelect from '@/components/SemesterSelect/SemesterSelect';
import { CoursesGrid } from '@/components/CoursesGrid/CoursesGrid';
import type { Role } from '@/types/User';
import type { NavbarItem } from '@/types/navigation';
import SemesterMultiSelect from '@/components/SemesterMultiSelect/SemesterMultiSelect';
import { getCurrentSemester, SemesterName } from '@/hooks/useSemesterOptions';
import { useState } from 'react';
import { useMemo, useEffect } from 'react';
export default function CourseSections({
  role,
  navItems,
  uemail,
}: {
  role: Role;
  navItems: NavbarItem[];
  uemail: string;
}) {
  const [semesters, setSemesters] = useState<SemesterName[]>(() => {
    const stored = localStorage.getItem('selectedSemesters');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('selectedSemesters', JSON.stringify(semesters));
  }, [semesters]);

  const {
    currentSemester,
    options,
    courses,
    isLoading,
    isFetching,
    error,
    showSkeletons,
    skeletonCount,
  } = useSemesterData(role, uemail, semesters);

  const currentSemArray = useMemo(
    () => (currentSemester ? [currentSemester] : []),
    [currentSemester]
  );
  const {
    courses: currentCourses,
    isLoading: isCurrentLoading,
    isFetching: isCurrentFetching,
    error: currentError,
    showSkeletons: showCurrentSkeletons,
    skeletonCount: currentSkeletonCount,
  } = useSemesterData(role, uemail, currentSemArray);

  return (
    <>
      <div className="mb-5">
        <div className="text-h6 mb-3">Current Courses </div>

        <CoursesGrid
          courses={currentCourses}
          isLoading={isCurrentLoading}
          isFetching={isCurrentFetching}
          error={currentError}
          showSkeletons={showCurrentSkeletons}
          skeletonCount={currentSkeletonCount}
          semester={currentSemArray}
          path={'courses'}
        />
      </div>

      <div className="mb-5">
        <h1 className="text-h6 mb-3">Past Courses</h1>
        <SemesterMultiSelect value={semesters} onChange={setSemesters} />

        <CoursesGrid
          courses={courses}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          showSkeletons={showSkeletons}
          skeletonCount={skeletonCount}
          semester={semesters ?? []}
          path={'courses'}
        />
      </div>
    </>
  );
}
