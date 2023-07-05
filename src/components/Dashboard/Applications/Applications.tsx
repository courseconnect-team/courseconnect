import ApplicationGrid from './ApplicationGrid';

// for admin and faculty views

interface ApplicationsProps {
  userRole: string;
}

export default function Applications(props: ApplicationsProps) {
  const { userRole } = props;
  return (
    <>
      <h1>Applications</h1>
      <ApplicationGrid userRole={userRole} />
    </>
  );
}
