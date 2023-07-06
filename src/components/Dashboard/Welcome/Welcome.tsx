import Container from '@mui/material/Container';

interface DashboardProps {
  user: any;
  userRole: string;
}

export default function DashboardWelcome(props: DashboardProps) {
  const { userRole, user } = props;

  return (
    <>
      <Container maxWidth="lg">
        <h1>
          Welcome, {userRole} {user?.email}!
        </h1>
      </Container>
    </>
  );
}
