import React, { CSSProperties } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import { HandleDeleteUser } from '@/firebase/auth/auth_delete_prompt';

interface CreateCourseDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const deleteUserButtonStyle: CSSProperties = {
  backgroundColor: '#5736ac',
  color: '#ffffff',
  borderRadius: '8px',
  height: '50px',
  width: '200px',
  textTransform: 'none',
};

const popUpStyle = {
  borderImage:
    'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
  boxShadow: '0px 2px 20px 4px #00000040',
  border: '2px solid',
};

const dialogTitleStyle: CSSProperties = {
  fontFamily: 'SF Pro Display-Medium, Helvetica',
  textAlign: 'center',
  fontSize: '30px',
  padding: '4px',
  fontWeight: '400',
};

const dialogContentStyle: CSSProperties = {
  fontFamily: 'SF Pro Display-Medium, Helvetica',
  textAlign: 'center',
  fontSize: '20px',
  color: 'black',
  padding: '8px',
  marginLeft: '16px',
  marginRight: '16px',
};

const dialogButtonContainerStyle: CSSProperties = {
  padding: '16px',
  display: 'flex',
  justifyContent: 'space-evenly',
};

const cancelButtonStyle: CSSProperties = {
  fontSize: '16px',
  borderRadius: '8px',
  height: '40px',
  width: '120px',
  textTransform: 'none',
  fontFamily: 'SF Pro Display-Bold , Helvetica',
  borderColor: '#808080',
  color: '#808080',
  borderWidth: '2px',
};

const deleteButtonStyle: CSSProperties = {
  fontSize: '16px',
  marginLeft: '0px',
  borderRadius: '8px',
  height: '40px',
  width: '120px',
  textTransform: 'none',
  fontFamily: 'SF Pro Display-Bold , Helvetica',
  backgroundColor: '#5736ac',
  color: '#ffffff',
};

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
    <>
      <Button
        size="large"
        variant="contained"
        startIcon={<PersonRemoveOutlinedIcon />}
        onClick={handleClickOpen}
        style={deleteUserButtonStyle}
      >
        Delete User
      </Button>

      <Dialog
        style={popUpStyle}
        PaperProps={{
          style: { borderRadius: '16px' },
        }}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle style={dialogTitleStyle}>Delete Profile</DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent style={dialogContentStyle}>
            Are you sure you want to delete your profile?
          </DialogContent>
          <DialogActions style={dialogButtonContainerStyle}>
            <Button variant="outlined" style={cancelButtonStyle} onClick={handleClose}>
              Cancel
            </Button>

            <Button variant="contained" style={deleteButtonStyle} type="submit">
              Delete
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default DeleteUserDialog;
