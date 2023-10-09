import Container from '@mui/material/Container';
import UnderDevelopment from '@/components/UnderDevelopment';
import { Toaster } from 'react-hot-toast';

interface DashboardProps {
  user: any;
  userRole: string;
}

export default function DashboardWelcome(props: DashboardProps) {
  const { userRole, user } = props;

  return (
    <>
      <Toaster />
      <Container maxWidth="lg">
        <h1>
          Welcome, {userRole} {user?.email}!
        </h1>
        <UnderDevelopment />
      </Container>
    </>
  );
}
