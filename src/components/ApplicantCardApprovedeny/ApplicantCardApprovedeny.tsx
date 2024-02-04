import { FunctionComponent, useCallback } from 'react';
import './style.css';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { wrap } from 'module';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

interface ApplicantCardProps {
  id:string;
  uf_email: string;
  firstname: string;
  lastname: string;
  number: string;
  position: string;
  semester: string;
  availability: string;
  department: string;
  degree: string;
  collegestatus: string;
  qualifications: string;
  resume: string;
  plan: string;
  expanded: boolean;
  onExpandToggle: any;
  openApprove: boolean;
  openDeny: boolean;
  setOpenApproveDialog: (value: boolean) => void;
  setOpenDenyDialog: (value: boolean) => void;
}

const ApplicantCardApprovedeny: FunctionComponent<ApplicantCardProps> = ({
  id,
  uf_email,
  firstname,
  lastname,
  number,
  position,
  semester,
  availability,
  department,
  degree,
  collegestatus,
  qualifications,
  resume,
  plan,
  expanded,
  onExpandToggle,
  openApprove,
  openDeny,
  setOpenApproveDialog,
  setOpenDenyDialog,
}) => {

  const db = firebase.firestore();
  const handleApproveSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      const statusRef = db.collection('applications').doc(id);
      await statusRef.update({ status: 'Approved' });
      console.log('Application approved successfully');
    } catch (error) {
      console.error('Error approving application:', error);
    }
  };
  
  const handleDenySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      const statusRef = db.collection('applications').doc(id);
      await statusRef.update({ status: 'Denied' });
      console.log('Application denied successfully');
    } catch (error) {
      console.error('Error denying application:', error);
    }
  };

  const handleCloseApprove = () => {
    setOpenApproveDialog(false);
  };


  const handleCloseDeny = () => {
    setOpenDenyDialog(false);
  };

  const onThumbUpClick = useCallback(() => {
    setOpenApproveDialog(true);
  }, []);

  const onThumbDownIconClick = useCallback(() => {
    setOpenDenyDialog(true);
  }, []);

  const renderApproveDialog = () => (
    <Dialog
      style={{
        borderImage:
          'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
        boxShadow: '0px 2px 20px 4px #00000040',
        borderRadius: '20px',
        border: '2px solid',
      }}
      open={openApprove}
      onClose={handleCloseApprove}
    >
      <DialogTitle
        style={{
          textAlign: 'center',
          fontSize: '36px',
          fontWeight: '500',
          fontFamily: 'SF Pro Display-Medium',
        }}
      >
        Approve Applicant
      </DialogTitle>
      <form onSubmit={handleApproveSubmit}>
        <DialogContent>
          <DialogContentText
            style={{
              marginTop: '35px',
              fontFamily: 'SF Pro Display-Medium, Helvetica',
              textAlign: 'center',
              fontSize: '24px',
            }}
          >
            Are you sure you want to approve this applicant?
          </DialogContentText>
        </DialogContent>
        <DialogActions
          style={{
            marginTop: '30px',
            marginBottom: '42px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '93px',
          }}
        >
          <Button
            variant="outlined"
            style={{
              marginLeft: '110px',
              borderRadius: '10px',
              height: '43px',
              width: '120px',
              textTransform: 'none',
              fontFamily: 'SF Pro Display-Bold , Helvetica',
              borderColor: '#5736ac',
              color: '#5736ac',
            }}
            onClick={handleCloseApprove}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            style={{
              marginRight: '110px',
              borderRadius: '10px',
              height: '43px',
              width: '120px',
              textTransform: 'none',
              fontFamily: 'SF Pro Display-Bold , Helvetica',
              backgroundColor: '#5736ac',
              color: '#ffffff',
            }}
            type = "submit"
            
          >
            Approve
          </Button>
        </DialogActions>
        </form>
    </Dialog>
  );
  const renderDenyDialog = () => (
    <Dialog
      style={{
        borderImage:
          'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
        boxShadow: '0px 2px 20px 4px #00000040',
        borderRadius: '20px',
        border: '2px solid',
      }}
      open={openDeny}
      onClose={handleCloseDeny}
    >
      <DialogTitle
        style={{
          textAlign: 'center',
          fontSize: '36px',
          fontWeight: '500',
          fontFamily: 'SF Pro Display-Medium',
        }}
      >
        Deny Applicant
      </DialogTitle>
      <form onSubmit={handleDenySubmit}>
        <DialogContent>
          <DialogContentText
            style={{
              marginTop: '35px',
              fontFamily: 'SF Pro Display-Medium, Helvetica',
              textAlign: 'center',
              fontSize: '24px',
            }}
          >
            Are you sure you want to deny this applicant?
          </DialogContentText>
        </DialogContent>
        <DialogActions
          style={{
            marginTop: '30px',
            marginBottom: '42px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '93px',
          }}
        >
          <Button
            variant="outlined"
            style={{
              marginLeft: '110px',
              borderRadius: '10px',
              height: '43px',
              width: '120px',
              textTransform: 'none',
              fontFamily: 'SF Pro Display-Bold , Helvetica',
              borderColor: '#5736ac',
              color: '#5736ac',
            }}
            onClick={handleCloseDeny}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            style={{
              marginRight: '110px',
              borderRadius: '10px',
              height: '43px',
              width: '120px',
              textTransform: 'none',
              fontFamily: 'SF Pro Display-Bold , Helvetica',
              backgroundColor: '#5736ac',
              color: '#ffffff',
            }}
            type="submit"
          >
            Deny
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );

  const handleCardClick = () => {
    onExpandToggle(); // Call the callback function to update parent state
  };

  return (
    <div className="applicantCardApprovedeny1">
      {!expanded && (
        <>
          <div>
            <div className="ellipse" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="name">
                {firstname} {lastname}
              </div>
              <div className="email1">{uf_email}</div>
            </div>
          </div>

          <div className="thumbsContainer">
            <ThumbUpOffAltIcon
              onClick={onThumbUpClick}
              className="thumbsUpIcon"
              style={{
                fontSize: '41px',
              }}
            />
            {renderApproveDialog()}
            <ThumbDownOffAltIcon
              onClick={onThumbDownIconClick}
              className="thumbsDownIcon"
              style={{
                fontSize: '41px',
              }}
            />
            {renderDenyDialog()}
            <div className="applicantStatus23"onClick={handleCardClick}>
              <div className="review23">
                Review
              </div>
            </div>
          </div>
        </>
      )}

      {expanded && (
        <div>
          <div>
            <div className="ellipse" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="name">
                {firstname} {lastname}
              </div>
              <div style={{ position: 'absolute' }}>
                <div className="email1">{uf_email}</div>
                <div className="number">{number}</div>
              </div>
              <div className="thumbsContainer">
                <ThumbUpOffAltIcon
                  onClick={onThumbUpClick}
                  className="thumbsUpIcon"
                  style={{
                    fontSize: '41px',
                  }}
                />
                {renderApproveDialog()}
                <ThumbDownOffAltIcon
                  onClick={onThumbDownIconClick}
                  className="thumbsDownIcon"
                  style={{
                    fontSize: '41px',
                  }}
                />
                {renderDenyDialog()}
                <div className="applicantStatus23"onClick={handleCardClick} >
                  <div className="review23" >
                    Review
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginLeft: '143px',
              flexWrap: 'wrap',
              marginRight: '139px',
            }}
          >

            <div style = {{display:'flex', gap:'61px'}}>
            <div className="label50">Applying for:</div>
            <div >{position}</div>
            </div>
            <div style = {{display:'flex', gap:'61px'}}>
            <div className="label50">Semester(s):</div>
            <div>{semester}</div>
            </div>
            <div style = {{display:'flex', gap:'75px'}}>
            <div className="label50">Availability:</div>
            <div className="availability1">{availability}</div>
            </div>

            <br></br>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row', // Keep it as 'row' for a horizontal row layout
                gap: '144px', // Adjust the gap as needed
                marginBottom: '31px',
              }}
            >
              <div>
                <div className="label50">Department:</div>
                <div style = {{textAlign: "center"}} className="availability1">{department}</div>
              </div>

              <div>
                <div className="label50">Degree:</div>
                <div style = {{textAlign: "center"}} className="availability1">{degree}</div>
              </div>

              <div>
                <div className="label50">Upcoming semester status:</div>
                <div style = {{textAlign: "center"}} className="availability1">{collegestatus}</div>
              </div>
            </div>

            <div style = {{marginBottom: '10px'}}className="label50">Qualifications:</div>
            <div className="availability1" style={{ marginBottom: '31px' }}>
              {qualifications}
            </div>
            <div style = {{marginBottom: '10px'}} className="label50">Graduate Plan:</div>
            <div className="availability1" style={{ marginBottom: '31px' }}>
              {plan}
            </div>
            <div style = {{marginBottom: '10px'}} className="label50">Resume Link:</div>
            <a style={{ marginBottom: '104px' }} href={resume}>
              {resume}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantCardApprovedeny;
