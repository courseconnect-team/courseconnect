// little message welcoming user to dashboard, inviting user to explore and click stuff
// include user name or something here

interface DashboardProps {
  user: any;
  userRole: string;
}

export default function DashboardWelcome(props: DashboardProps) {
  const { userRole, user } = props;

  return (
    <>
      <h1>
        Welcome, {userRole} {user?.email}!
      </h1>
    </>
  );
}
