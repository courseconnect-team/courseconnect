import ApplicationTable from './ApplicationTable';

// for admin and faculty views
export default function Applications() {
  return (
    <>
      <h1>Admin view of applications that has a table & CRUD</h1>
      <ApplicationTable />
    </>
  );
}
