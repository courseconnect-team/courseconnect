import Container from '@mui/material/Container';
import StatsGrid from './StatsGrid';
import ApprovalGrid from './ApprovalGrid';
interface UsersProps {
  userRole: string;
}

export default function FacultyStats(props: UsersProps) {
  const { userRole } = props;
  return (
    <>
      <Container maxWidth={false} sx={{ maxWidth: "90%" }}>
        <div style={{ marginBottom: "100px" }}>
          <StatsGrid userRole={userRole} />
        </div>
      </Container>
    </>
  );
}
