import ApplicationGrid from './ApplicationGrid';
import AssignmentGrid from './AssignmentGrid';
import Container from '@mui/material/Container';
// for admin and faculty views

interface ApplicationsProps {
  userRole: string;
}

export default function Applications(props: ApplicationsProps) {
  const { userRole } = props;
  // if admin
  if (userRole === 'admin') {
    return (
      <>
        <Container maxWidth={false} sx={{ maxWidth: '80%' }}>
          <h1>Applications</h1>
          <ApplicationGrid userRole={userRole} />
          <h1>Assignments</h1>
          <AssignmentGrid userRole={userRole} />
        </Container>
      </>
    );
  }
  // if faculy
  else if (userRole === 'faculty') {
    return (
      <>
        <Container maxWidth="lg">
          <h1>Applications</h1>
          <ApplicationGrid userRole={userRole} />
        </Container>
      </>
    );
  }
  // default: return nothing
  return <></>;
}
