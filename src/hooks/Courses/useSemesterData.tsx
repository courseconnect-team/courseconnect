// hooks/useSemesterCourses.ts
import { useState, useMemo } from 'react';
import { useSemesters, type SemesterName } from '@/hooks/useSemesterOptions';
import type { Role } from '@/types/User';
import { useQueries } from '@tanstack/react-query';
import { getFacultyCourses } from './useFetchFacultyApplications';
import { CourseTuple } from './useFetchFacultyMultiApplications';

export function useSemesterData(
  role: Role,
  uemail?: string,
  semesters?: SemesterName[]
) {
  const { currentSemester, options } = useSemesters();


  const names: SemesterName[] = semesters?.length ? semesters : [];
  const enabled =
    (role === 'faculty' || role === 'admin') && !!uemail && !!semesters && names.length > 0;
  const result = useQueries({
    queries: names.map((sem: SemesterName) => ({
      queryKey: ['facultyCourses', uemail, sem],
      queryFn: () => getFacultyCourses(sem, uemail!),
      enabled,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
      placeholderData: (prev: CourseTuple[] | undefined) => prev,
    })),
  });

  const courses: CourseTuple[] = result.flatMap((r) => r.data ?? []);
  const isLoading =
    enabled && (result.length === 0 || result.some((r) => r.isLoading));
  const isFetching = enabled && result.some((r) => r.isFetching);
  const error = result.find((r) => r.error)?.error ?? null;

  const { showSkeletons, skeletonCount } = useMemo(() => {
    const firstLoad = isLoading && courses.length === 0;
    return {
      showSkeletons: firstLoad,
      skeletonCount: courses.length > 0 ? courses.length : 6,
    };
  }, [isLoading, courses.length]);

  return {
    currentSemester,
    options,
    courses,
    isLoading,
    isFetching,
    error,
    showSkeletons,
    skeletonCount,
  };
}
