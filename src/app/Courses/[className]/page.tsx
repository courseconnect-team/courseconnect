'use client';

import { FC } from 'react';
import CourseDetails from '@/newcomponents/CourseDetails/CourseDetails';
import { useParams, useSearchParams } from 'next/navigation';
import { LinearProgress } from '@mui/material';
import { useCourseDetails } from '@/hooks/Courses/useFetchCourse';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import PageLayout from '@/newcomponents/PageLayout/PageLayout';
import { getNavItems } from '@/hooks/useGetItems';

const StatisticsPage: FC = () => {
  const params = useParams<{ className: string }>();
  const searchParams = useSearchParams();
  const onGoing = searchParams.get('onGoing') === 'true';

  const [user, role, loading, roleError] = useUserInfo();

  const rawId = params.className;
  const courseId = decodeURIComponent(rawId);

  const { course, isLoading, isFetching, error } = useCourseDetails(
    courseId,
    onGoing
  );
  if (loading) return <LinearProgress />;
  if (roleError) return <p>Error loading role</p>;
  if (!user) return <p>Please sign in.</p>;

  // FIXED: AND, not OR
  if (role !== 'faculty' && role !== 'admin') return <p>Not authorized.</p>;

  if (isLoading || loading) return <LinearProgress />;
  if (error || roleError)
    return <PageLayout mainTitle="Error" navItems={getNavItems(role)} />;
  if (!course)
    return (
      <PageLayout mainTitle="Course not Found" navItems={getNavItems(role)} />
    );

  return (
    <PageLayout mainTitle={""} navItems={getNavItems(role)}>
      <CourseDetails {...course} schedule={course.meetingTimes} />
    </PageLayout>
  );
};

export default StatisticsPage;
