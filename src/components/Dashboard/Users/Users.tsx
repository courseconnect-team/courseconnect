import Container from '@mui/material/Container';
import UserGrid from './UserGrid';

interface UsersProps {
  userRole: string;
}

export default function Users(props: UsersProps) {
  const { userRole } = props;
  return (
    <>
      <Container maxWidth="xl">
        <UserGrid userRole={userRole} />
      </Container>
    </>
  );
}
