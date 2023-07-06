'use client';
import Container from '@mui/material/Container';
import { Typography } from '@mui/material';

export default function AboutPage() {
  return (
    <>
      <main className="">
        <Container maxWidth="lg">
          <h1>Welcome to Course Connect!</h1>

          <p>
            Course Connect is an innovative online web application designed to
            streamline the management of teaching assistant (TA), peer
            instructor (PI), and grader positions within educational
            institutions. Our platform offers a seamless experience for
            students, faculty, and administrators, allowing them to efficiently
            connect and collaborate.
          </p>

          <h2>For Students:</h2>
          <p>
            As a student, Course Connect provides you with the opportunity to
            apply for TA, PI, or grader positions. Submit your application
            through our intuitive interface and keep track of its status.
            You&apos;ll receive notifications when you are assigned to a course,
            ensuring that you stay informed every step of the way. Once
            assigned, you can easily access and view your course(s) as an
            employee, making it convenient to manage your responsibilities.
          </p>

          <h2>For Faculty:</h2>
          <p>
            Course Connect empowers faculty members to effortlessly handle the
            application process for TA, PI, and grader positions. Receive
            applications from students, view them within our user-friendly
            platform, and make informed decisions by accepting or denying them.
            Furthermore, you can access a comprehensive overview of your
            course(s), including enrollment and other essential statistics. Stay
            organized and maintain a clear understanding of your teaching team
            with Course Connect.
          </p>

          <h2>For Administrators:</h2>
          <p>
            Course Connect simplifies the administrative tasks associated with
            managing users, courses, and applications. Our platform provides a
            centralized database with real-time connections, allowing
            administrators to efficiently create, view, update, and delete
            users, courses, and applications through neat tables. Accessing
            vital statistics about users, courses, and applications is just a
            click away. With Course Connect, administrators can easily assign
            accepted students to their respective courses, ensuring a smooth
            workflow throughout the institution.
          </p>

          <h2>All in all?</h2>
          <p>
            Course Connect is your all-in-one solution for managing the TA, PI,
            and grader processes. Whether you are a student looking for
            opportunities, a faculty member seeking to streamline your workflow,
            or an administrator in charge of overseeing the entire system,
            Course Connect offers the features and functionality you need to
            succeed.
          </p>
        </Container>
      </main>
    </>
  );
}
