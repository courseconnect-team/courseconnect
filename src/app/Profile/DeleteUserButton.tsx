import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
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
        size="large"
        variant="contained"
        startIcon={<PersonRemoveOutlinedIcon />}
        onClick={handleClickOpen}
        style={{ backgroundColor: '#5736ac', color: '#ffffff', borderRadius: "10px", height: "53px", width: "180px", textTransform: "none" }}
      >
        Delete User
      </Button>

      <Dialog style={{ borderImage: "linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1", boxShadow: "0px 2px 20px 4px #00000040", borderRadius: "20px", border: "2px solid" }} PaperProps={{
        style: { borderRadius: 20 }
      }} open={open} onClose={handleClose} >
        <DialogTitle style={{ fontFamily: "SF Pro Display-Medium, Helvetica", textAlign: "center", fontSize: "35px", fontWeight: "540" }}>Delete Applicant</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <DialogContentText style={{ marginTop: "35px", fontFamily: "SF Pro Display-Medium, Helvetica", textAlign: "center", fontSize: "24px", color: "black" }}>
              Are you sure you want to delete this user?
            </DialogContentText>
          </DialogContent>
          <DialogActions style={{ marginTop: "30px", marginBottom: "42px", display: "flex", justifyContent: "space-between", gap: "93px" }}>
            <Button variant="outlined" style={{ fontSize: "17px", marginLeft: "110px", borderRadius: "10px", height: '43px', width: '120px', textTransform: "none", fontFamily: "SF Pro Display-Bold , Helvetica", borderColor: '#5736ac', color: '#5736ac', borderWidth: "3px" }} onClick={handleClose}>Cancel</Button>

            <Button variant="contained" style={{ fontSize: "17px", marginRight: "110px", borderRadius: "10px", height: '43px', width: '120px', textTransform: "none", fontFamily: "SF Pro Display-Bold , Helvetica", backgroundColor: '#5736ac', color: '#ffffff' }} type="submit">Delete</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default DeleteUserDialog;
