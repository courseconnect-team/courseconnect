// show user details

interface ProfileProps {
  userRole: string;
  user: any;
}

export default function Profile(props: ProfileProps) {
  const { userRole, user } = props;
  return (
    <>
      <h1>Profile</h1>
    </>
  );
}
