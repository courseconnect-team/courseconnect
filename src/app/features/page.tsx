'use client';
import Container from '@mui/material/Container';

export default function FeaturesPage() {
  return (
    <>
      <main className="">
        <Container maxWidth="lg">
          <h1>Features</h1>
          <h2>Students:</h2>
          <ul>
            <li>
              Submit an application to be a teaching assistant (TA), peer
              instructor (PI), or grader.
            </li>
            <li>
              Track the status of your application and receive notifications
              when assigned to a course.
            </li>
            <li>View your assigned course(s) as an employee.</li>
          </ul>

          <h2>Faculty:</h2>
          <ul>
            <li>
              Receive, view, and accept or deny applications from students for
              TA, PI, or grader positions.
            </li>
            <li>Access course(s) and view enrollment and other statistics.</li>
          </ul>

          <h2>Administrators:</h2>
          <ul>
            <li>
              Manage users, courses, and applications in neat tables with
              real-time connection to a centralized database.
            </li>
            <li>
              Create, view, update, and delete users, courses, and applications.
            </li>
            <li>View statistics about users, courses, and applications.</li>
            <li>Assign accepted students to courses.</li>
          </ul>

          <h2>Features Under Development</h2>
          <p>
            Some features are still under development. Please bear with us while
            we work on the things below:
          </p>
          <ul>
            <li>Styling of the website (font, color palette, etc.)</li>
            <li>Email verification.</li>
            <li>Forgot password.</li>
            <li>Form validation.</li>
            <li>TA/PI/Grader Request button for faculty.</li>
            <li>
              Expanding course data to include days of the week, location(s),
              and time(s).
            </li>
            <li>
              Notifications upon various actions, such as course assignment for
              a recently-hired PI.
            </li>
            <li>
              Upload and parsing of English proficiency verification documents.
            </li>
            <li>Visual display of user, course, and application statistics.</li>
            <li>
              Individual display of course and application data as a pop-up.
            </li>
          </ul>
        </Container>
      </main>
    </>
  );
}
