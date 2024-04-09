import Container from '@mui/material/Container';
import UserGrid from './UserGrid';
import ApprovalGrid from'./ApprovalGrid';
interface UsersProps {
  userRole: string;
}

export default function Users(props: UsersProps) {
  const { userRole } = props;
  return (
    <>
      <Container maxWidth="xl">
        <div style = {{marginBottom: "100px"}}>
          All Users
        <UserGrid userRole={userRole} />
        </div>
        Unapproved Users
        <ApprovalGrid userRole = {userRole}/>
      </Container>
    </>
  );
}
