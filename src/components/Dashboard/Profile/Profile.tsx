import Container from '@mui/material/Container';
import UnderDevelopment from '@/components/UnderDevelopment';

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
        <UnderDevelopment />
      </Container>
    </>
  );
}
