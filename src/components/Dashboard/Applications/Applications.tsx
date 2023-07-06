import ApplicationGrid from './ApplicationGrid';
import Container from '@mui/material/Container';
// for admin and faculty views

interface ApplicationsProps {
  userRole: string;
}

export default function Applications(props: ApplicationsProps) {
  const { userRole } = props;
  return (
    <>
      <Container maxWidth="lg">
        <h1>Applications</h1>
        <ApplicationGrid userRole={userRole} />
        <h1>Assignment</h1>
      </Container>
    </>
  );
}
