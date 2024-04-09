import Container from '@mui/material/Container';
import CourseGrid from '../Courses/CourseGrid';

interface UsersProps {
  userRole: string;
  semester: string;
}

export default function Users(props: UsersProps) {
  const { userRole, semester } = props;
  return (
    <>
      <Container maxWidth="xl">
        <CourseGrid userRole={userRole} semester={semester} />
      </Container>
    </>
  );
}
