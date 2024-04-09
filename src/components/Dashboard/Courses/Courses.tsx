import Container from '@mui/material/Container';
import CourseGrid from './CourseGrid';

interface CoursesProps {
  userRole: string;
}

export default function Courses(props: CoursesProps) {
  const { userRole } = props;
  return (
    <>
      <Container maxWidth="lg">
        <h1>Courses</h1>
        <CourseGrid userRole={userRole} semester='none' />
      </Container>
    </>
  );
}
