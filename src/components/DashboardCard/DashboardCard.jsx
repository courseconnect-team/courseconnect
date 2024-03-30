import PropTypes from "prop-types";
import React from "react";
import styles from "./style.module.css";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import Button from '@mui/material/Button';
export const DashboardCard = ({ className, image, text, clickable = false }) => {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setOpen(false);
  }
  const handleSubmit = () => {
    setOpen(false);

    console.log(open)
  }
  return (
    <div className={className} >
      <div className={styles.card} onClick={e => {
        if (clickable) {
          e.preventDefault();
        }
        setOpen(true)
      }}>
        <div className={styles.innercontent2}>
          <img className={styles.img2} alt="Card" src={image} />

          <div>{text}</div>
        </div>
      </div>

      {clickable &&
        <Dialog sx={{
          "& .MuiDialog-container": {
            "& .MuiPaper-root": {
              width: "100%",
              maxWidth: "550px",  // Set your width here
            },
          },
        }} style={{ borderImage: "linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1", boxShadow: "0px 2px 20px 4px #00000040", borderRadius: "20px", border: "2px solid" }} PaperProps={{
          style: { borderRadius: 20 }
        }} open={open} onClose={handleClose} >
          <DialogTitle style={{ fontFamily: "SF Pro Display-Medium, Helvetica", textAlign: "center", fontSize: "40px", fontWeight: "540" }}>Under Development</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <DialogContentText style={{ marginTop: "35px", fontFamily: "SF Pro Display-Medium, Helvetica", textAlign: "center", fontSize: "24px", color: "black" }}>
                This feature is still under development.
              </DialogContentText>


            </DialogContent>
            <DialogActions style={{ marginTop: "30px", marginBottom: "42px", display: "flex", justifyContent: "space-between", gap: "93px" }}>

              <Button variant="contained" style={{ fontSize: "17px", marginLeft: "190px", marginRight: "0px", borderRadius: "10px", height: '43px', width: '120px', textTransform: "none", fontFamily: "SF Pro Display-Bold , Helvetica", backgroundColor: '#5736ac', color: '#ffffff' }} onClick={handleSubmit}>Ok</Button>
            </DialogActions>
          </form>
        </Dialog>
      }

    </div>
  );
};

DashboardCard.propTypes = {
  image: PropTypes.string,
  text: PropTypes.string,
  clickable: PropTypes.bool,
};

