import Container from '@mui/material/Container';

interface ProfileProps {
  userRole: string;
  user: any;
}

export default function Profile(props: ProfileProps) {
  const { userRole, user } = props;
  return (
    <>
      <Container maxWidth="lg">
        <h1>Profile</h1>
        <h2>Role: {userRole}</h2>
        <h2>Email: {user?.email}</h2>
      </Container>
    </>
  );
}
