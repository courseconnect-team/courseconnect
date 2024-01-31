import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import AddIcon from '@mui/icons-material/Add';
import { GridRowsProp } from '@mui/x-data-grid';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import LinearProgress from '@mui/material/LinearProgress';
import { CircularProgress } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
interface CreateCourseDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  setSuccess: (value: boolean) => void;
  setCourseData: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
}

const CreateCourseDialog: React.FC<CreateCourseDialogProps> = ({
  open,
  setOpen,
  setSuccess,
  setCourseData,
}) => {
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);

    console.log(loading);

    event.preventDefault();
    // extract the form data from the current event
    const formData = new FormData(event.currentTarget);

    const professorsNameString = formData.get('professor-names') as string;
    const professorNameList = professorsNameString
      .split(',')
      .map((professorName) => professorName.trim());

    const professorsEmailString = formData.get('professor-emails') as string;
    const professorEmailList = professorsEmailString
      .split(',')
      .map((professorEmail) => professorEmail.trim());

    // extract the specific user data from the form data into a parsable object
    const courseData = {
      code: formData.get('course-code') as string,
      title: formData.get('course-title') as string,
      id: formData.get('class-number') as string,
      professor_names: professorNameList as string[],
      professor_emails: professorEmailList as string[],
      helper_names: [] as string[],
      helper_emails: [] as string[],
      credits: formData.get('course-credits') as string,
      enrollment_cap: formData.get('enrollment-cap') as string,
      num_enrolled: formData.get('num-enrolled') as string,
    };

    var testRegex = /^[a-zA-Z0-9]+$/;
    var numberRegex = /^[0-9]+$/;
    if (!testRegex.test(courseData.code)) {
      toast.error(
        'Course code should only consist of number or letters (no spaces)!'
      );
      return;
    } else if (courseData.code === '') {
      toast.error('Please enter a course code!');
      return;
    } else if (courseData.title == '') {
      toast.error('Please enter a course title!');
      return;
    } else if (courseData.id.length != 5 || !numberRegex.test(courseData.id)) {
      toast.error('Please enter a valid class number!');
      return;
    } else if (courseData.professor_names.length == 0) {
      toast.error('Please enter professor names!');
      return;
    } else if (courseData.professor_emails.length == 0) {
      toast.error('Please enter professor emails!');
      return;
    } else if (courseData.credits === '') {
      toast.error('Please enter the credit amount!');
      return;
    }

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
      // Update the course data with the new row
      setCourseData((oldRows) => [...oldRows, courseData]);
      setSuccess(true);
      // close the dialog
      handleClose();
      setLoading(false);
    } else {
      console.log('ERROR: Course data failed to send to server');
      toast.error("Course data failed to send to server!");
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        size="small"
        variant="text"
        startIcon={<AddIcon />}
        onClick={handleClickOpen}
      >
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
              required
              margin="dense"
              id="course-credits"
              name="course-credits"
              label="Number of Credits"
              type="number"
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
            {loading ? <CircularProgress size={20} color="warning" /> : null}
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit">Create</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default CreateCourseDialog;
