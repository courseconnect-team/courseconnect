/*
there are multiple states represented here:
  1. student has applied (student_applied)
simply display the application status
  2. student has been denied (student_denied)
display that the student has been denied and offer a dialog with the application form to resubmit
  3. student has been accepted but not assigned (student_accepted)
display that the student has been accepted and say that they will receive an email when
they have been assigned a course
*/

interface AppStatusProps {
  user: any;
  userRole: string;
}

export default function ShowApplicationStatus(props: AppStatusProps) {
  const { userRole, user } = props;

  if (userRole === 'student_applied') {
    return (
      <>
        <h1>Your application has been received.</h1>
        <h2>It is under review.</h2>
      </>
    );
  } else if (userRole === 'student_denied') {
    return (
      <>
        <h1>Your application has been denied.</h1>
        <h2>You can reapply below:</h2>
        <p>button here</p>
      </>
    );
  } else if (userRole === 'student_accepted') {
    return (
      <>
        <h1>Your application has been accepted!</h1>
        <h2>You shall be assigned a course soon.</h2>
      </>
    );
  }
  return <></>;
}
