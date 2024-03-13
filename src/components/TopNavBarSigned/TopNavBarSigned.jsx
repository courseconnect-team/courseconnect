import React from "react";
import "./style.css";
import Link from "next/link";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import Button from '@mui/material/Button';
import handleSignOut from '@/firebase/auth/auth_signout';
export const TopNavBarSigned = ({ className }) => {

  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setOpen(false);
  }
  const handleSubmit = () => {
    handleSignOut();
    setOpen(false);
  }
  return (
    <div className={`top-nav-bar-signed ${className}`}>
      <Link href="/about">
        <div className="text-wrapper-3">About</div>
      </Link>

      <Link href="/dashboard">
        <div className="text-wrapper-4">Home</div>
      </Link>

      <button className="logout-button" onClick={() => setOpen(true)}>
        <div className="overlap-group">
          <div className="text-wrapper-5">Logout</div>
        </div>
      </button>


      <Dialog style={{ borderImage: "linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1", boxShadow: "0px 2px 20px 4px #00000040", borderRadius: "20px", border: "2px solid" }} PaperProps={{
        style: { borderRadius: 20 }
      }} open={open} onClose={handleClose} >
        <DialogTitle style={{ fontFamily: "SF Pro Display-Medium, Helvetica", textAlign: "center", fontSize: "40px", fontWeight: "540" }}>Logout</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <DialogContentText style={{ marginTop: "35px", fontFamily: "SF Pro Display-Medium, Helvetica", textAlign: "center", fontSize: "24px", color: "black" }}>
              Are you sure you want to logout?
            </DialogContentText>


          </DialogContent>
          <DialogActions style={{ marginTop: "30px", marginBottom: "42px", display: "flex", justifyContent: "space-between", gap: "93px" }}>
            <Button variant="outlined" style={{ fontSize: "17px", marginLeft: "110px", borderRadius: "10px", height: '43px', width: '120px', textTransform: "none", fontFamily: "SF Pro Display-Bold , Helvetica", borderColor: '#5736ac', color: '#5736ac', borderWidth: "3px" }} onClick={handleClose}>Cancel</Button>

            <Button variant="contained" style={{ fontSize: "17px", marginRight: "110px", borderRadius: "10px", height: '43px', width: '120px', textTransform: "none", fontFamily: "SF Pro Display-Bold , Helvetica", backgroundColor: '#5736ac', color: '#ffffff' }} type="submit">Logout</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>



  );
};

