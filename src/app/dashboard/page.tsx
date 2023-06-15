import UserDisplay from '@/components/UserDisplay';
import SignOutButton from '@/components/SignOut/SignOutButton';

export default function Dashboard() {
  return (
    <>
      <h1>Dashboard page</h1>
      <UserDisplay />
      <SignOutButton />
    </>
  );
}
