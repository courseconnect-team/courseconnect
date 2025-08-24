import Container from '@mui/material/Container';
import CourseGrid from '../Courses/CourseGrid';

interface UsersProps {
  userRole: string;
  semester: string;
  processing: boolean;
}

export default function Users(props: UsersProps) {
  const { userRole, semester, processing } = props;
  return (
    <>
      <Container maxWidth="xl">
        <CourseGrid
          userRole={userRole}
          semester={semester}
          processing={processing}
        />
      </Container>
    </>
  );
}
