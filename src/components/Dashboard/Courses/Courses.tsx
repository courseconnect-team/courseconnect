import CourseGrid from './CourseGrid';

interface CoursesProps {
  userRole: string;
}

export default function Courses(props: CoursesProps) {
  const { userRole } = props;
  return (
    <>
      <h1>Courses</h1>
      <CourseGrid userRole={userRole} />
    </>
  );
}
