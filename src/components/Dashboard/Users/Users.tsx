import Container from '@mui/material/Container';
import UserGrid from './UserGrid';
import ApprovalGrid from './ApprovalGrid';
interface UsersProps {
  userRole: string;
}

export default function Users(props: UsersProps) {
  const { userRole } = props;
  return (
    <>
      <Container maxWidth={false} sx={{ maxWidth: "90%" }}>
        <div style={{ marginBottom: "100px" }}>
          <h1> All Users </h1>
          <UserGrid userRole={userRole} />
        </div>
        <h1> Unapproved Users </h1>
        <ApprovalGrid userRole={userRole} />
      </Container>
    </>
  );
}
