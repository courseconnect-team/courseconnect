import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function CreateCourseDialog() {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // extract the form data from the current event
    const formData = new FormData(event.currentTarget);

    // extract the specific user data from the form data into a parsable object
    const courseData = {
      code: formData.get('course-code') as string,
      title: formData.get('course-title') as string,
      class_number: formData.get('class-number') as string,
      professor_names: formData.get('professor-names') as string,
      professor_emails: formData.get('professor-emails') as string,
      helper_names: '' as string,
      helper_emails: '' as string,
      credits: formData.get('course-credits') as string,
      enrollment_cap: formData.get('enrollment-cap') as string,
      num_enrolled: formData.get('num-enrolled') as string,
    };

    // console.log(courseData); // FOR DEBUGGING ONLY!

    if (courseData.enrollment_cap === '') {
      courseData.enrollment_cap = '-1';
    }

    if (courseData.num_enrolled === '') {
      courseData.num_enrolled = '-1';
    }

    // console.log(courseData); // FOR DEBUGGING ONLY!

    // use fetch to send the user data to the server
    // this goes to a cloud function which creates a document based on
    // the data from the form, identified by the user's firebase auth uid
    const response = await fetch(
      'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/processCreateCourseForm',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      }
    );

    if (response.ok) {
      console.log('SUCCESS: Course data sent to server successfully');
      // location.reload(); refreshes the entire page, but ideally this shouldn't need to happen and the table should just update
      location.reload();
    } else {
      console.log('ERROR: Course data failed to send to server');
    }
  };

  return (
    <div>
      <Button variant="outlined" onClick={handleClickOpen}>
        Create Course
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create a Course</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <DialogContentText>
              To create a course manually, please enter the course information
              in the form below.
            </DialogContentText>
            <TextField
              autoFocus
              required
              margin="dense"
              id="course-code"
              name="course-code"
              label="Course Code"
              type="text"
              fullWidth
              variant="standard"
              helperText={
                <>
                  The alphanumeric code of the course.
                  <br />
                  Example: COP3502
                </>
              }
            />
            <TextField
              autoFocus
              required
              margin="dense"
              id="course-title"
              name="course-title"
              label="Course Title"
              type="text"
              fullWidth
              variant="standard"
              helperText={
                <>
                  The full title of the course.
                  <br />
                  Example: Programming Fundamentals 1
                </>
              }
            />
            <TextField
              autoFocus
              required
              margin="dense"
              id="class-number"
              name="class-number"
              label="Class Number"
              type="number"
              fullWidth
              variant="standard"
              helperText={
                <>
                  The 5-digit class number of the course.
                  <br />
                  Example: 12345
                </>
              }
            />
            <TextField
              autoFocus
              required
              margin="dense"
              id="professor-names"
              name="professor-names"
              label="Professor Name(s)"
              type="text"
              fullWidth
              variant="standard"
              helperText={
                <>
                  The full name(s) of the course&apos;s professor(s), separated
                  by commas if there are multiple.
                  <br />
                  1 professor example: Alberta Gator
                  <br />2 professors example: Alberta Gator, Albert Gator
                </>
              }
            />
            <TextField
              autoFocus
              required
              margin="dense"
              id="professor-emails"
              name="professor-emails"
              label="Professor Email(s)"
              type="text"
              fullWidth
              variant="standard"
              helperText={
                <>
                  The email(s) of the course&apos;s professor(s), separated by
                  commas if there are multiple.
                  <br />
                  1 professor example: alberta@ufl.edu
                  <br />2 professors example: alberta@ufl.edu, albert@ufl.edu
                </>
              }
            />
            <TextField
              autoFocus
              required
              margin="dense"
              id="course-credits"
              name="course-credits"
              label="Number of Credits"
              fullWidth
              variant="standard"
              helperText={
                <>
                  The amount of credits this course is worth.
                  <br />
                  Example: 3
                </>
              }
            />
            <TextField
              autoFocus
              margin="dense"
              id="enrollment-cap"
              name="enrollment-cap"
              label="Enrollment Cap"
              type="number"
              fullWidth
              variant="standard"
              helperText={
                <>
                  The maximum number of students who can enroll in this course.
                  <br />
                  Example: 150
                  <br />
                  *NOTE*: THIS FIELD IS OPTIONAL. If left blank, it will default
                  to -1.
                </>
              }
            />
            <TextField
              autoFocus
              margin="dense"
              id="num-enrolled"
              name="num-enrolled"
              label="Number Enrolled"
              type="number"
              fullWidth
              variant="standard"
              helperText={
                <>
                  The current number of students enrolled in this course.
                  <br />
                  Example: 75
                  <br />
                  *NOTE*: THIS FIELD IS OPTIONAL. If left blank, it will default
                  to -1.
                </>
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit">Create</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
