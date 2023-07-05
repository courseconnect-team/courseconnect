import UserGrid from './UserGrid';

interface UsersProps {
  userRole: string;
}

export default function Users(props: UsersProps) {
  const { userRole } = props;
  return (
    <>
      <h1>Users</h1>
      <UserGrid userRole={userRole} />
    </>
  );
}
