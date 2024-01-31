import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { HandleDeleteUser } from '@/firebase/auth/auth_delete_prompt';

interface CreateCourseDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const DeleteUserDialog: React.FC<CreateCourseDialogProps> = ({
  open,
  setOpen,
}) => {
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
    const userData = {
      email: formData.get('email-reverify') as string,
      password: formData.get('password-reverify') as string,
    };

    // pass this into the delete user function which reverifies the user
    // and then deletes the user from auth and the database
    HandleDeleteUser(userData.email, userData.password);
  };

  return (
    <div>
      <Button
        size="small"
        variant="text"
        startIcon={<PersonRemoveIcon />}
        onClick={handleClickOpen}
      >
        Delete Account
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
              margin="dense"
              id="email-reverify"
              name="email-reverify"
              label="Email"
              type="text"
              fullWidth
              variant="standard"
            />
            <TextField
              margin="dense"
              id="password-reverify"
              name="password-reverify"
              label="Password"
              type="password"
              fullWidth
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit">Delete Account</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default DeleteUserDialog;
