import CourseTable from './CourseTable';
import CreateCourseDialog from './Create_Course';

export default function Courses() {
  return (
    <>
      <h1>Admin view of courses that has a table & CRUD</h1>
      <CourseTable />
      <CreateCourseDialog />
    </>
  );
}
