import { FunctionComponent, useCallback, useState } from 'react';
import './style.css';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import {
  AppBar,
  Container,
  Stack,
  Paper,
  Fade,
  Box,
  Toolbar,
  Typography,
} from '@mui/material';
import FocusTrap from '@mui/material/Unstable_TrapFocus';
import { query, where, collection, getDocs, getDoc } from 'firebase/firestore';
interface ApplicantCardProps {
  id: string;
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
  gpa: string;
  expanded: boolean;
  onExpandToggle: any;
  openReview: boolean;
  setOpenReviewDialog: (value: boolean) => void;
  openRenew: boolean;
  setOpenRenewDialog: (value: boolean) => void;
  currentStu: string;
  setCurrentStu: (value: string) => void;
  className: string;
}
const ApplicantCardAssign: FunctionComponent<ApplicantCardProps> = ({
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
  gpa,
  expanded,
  onExpandToggle,
  openReview,
  setOpenReviewDialog,
  openRenew,
  setOpenRenewDialog,
  currentStu,
  setCurrentStu,

  className,
}) => {
  const db = firebase.firestore();
  const [viewMessage, setViewMessage] = useState(false);
  const handleMoveReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const statusRef = db.collection('applications').doc(currentStu);
      let doc = await getDoc(statusRef);
      let coursesMap = doc.data()?.courses;

      coursesMap[className] = 'applied';
      await statusRef.update({ courses: coursesMap });
      console.log('Application moved successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error approving application:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenReviewDialog(false);
    setOpenRenewDialog(false);
    setViewMessage(false);
  };

  const handleOpenReview = useCallback((event: any) => {
    event?.stopPropagation();

    setOpenReviewDialog(true);
    setCurrentStu(id);
  }, []);

  const handleViewMessage = () => {
    setViewMessage(true);
  };
  const handleOpenRenew = useCallback((event: any) => {
    event?.stopPropagation();

    setOpenRenewDialog(true);
    setCurrentStu(id);
  }, []);

  const renderRenewDialog = () =>
    !viewMessage ? (
      <Dialog
        style={{
          borderImage:
            'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
          boxShadow: '0px 2px 20px 4px #00000040',
          borderRadius: '20px',
          border: '2px solid',
        }}
        PaperProps={{
          style: { borderRadius: 20 },
        }}
        open={openRenew}
        onClose={handleCloseDialog}
      >
        <DialogTitle
          style={{
            fontFamily: 'SF Pro Display-Bold, Helvetica',
            textAlign: 'center',
            fontSize: '35px',
            fontWeight: '540',
            alignSelf: 'center',
          }}
        >
          <div>Renew</div>
          <div>
            {firstname} {lastname}
          </div>
        </DialogTitle>
        <form onSubmit={handleMoveReview}>
          <DialogContent>
            <DialogContentText
              style={{
                marginTop: '35px',
                fontFamily: 'SF Pro Display-Bold, Helvetica',
                textAlign: 'center',
                fontSize: '24px',
              }}
            >
              Are you sure you want to send a renewal to {firstname} {lastname}?
            </DialogContentText>
          </DialogContent>

          <DialogActions
            style={{
              marginTop: '30px',
              marginBottom: '42px',
              display: 'flex',
              justifyContent: 'center',
              marginLeft: '10px',
              marginRight: '10px',
              gap: '20px',
            }}
          >
            <Button
              variant="outlined"
              style={{
                borderRadius: '10px',
                height: '43px',
                width: '120px',
                textTransform: 'none',
                fontFamily: 'SF Pro Display-Bold , Helvetica',
                borderColor: '#5736ac',
                borderWidth: '4px',

                color: '#5736ac',
              }}
              onClick={handleCloseDialog}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              style={{
                borderRadius: '10px',
                height: '43px',
                width: '170px',
                textTransform: 'none',
                fontFamily: 'SF Pro Display-Bold , Helvetica',
                borderColor: '#5736ac',
                borderWidth: '4px',
                color: '#5736ac',
              }}
              onClick={handleViewMessage}
            >
              Review Message
            </Button>
            <Button
              variant="contained"
              style={{
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
              Send
            </Button>
          </DialogActions>
        </form>{' '}
      </Dialog>
    ) : (
      <Dialog
        style={{
          borderImage:
            'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
          boxShadow: '0px 2px 20px 4px #00000040',
          borderRadius: '20px',
          border: '2px solid',
        }}
        PaperProps={{
          style: { borderRadius: 20 },
        }}
        fullWidth
        maxWidth="lg"
        open={openRenew}
        onClose={handleCloseDialog}
      >
        <Paper
          role="dialog"
          aria-modal="false"
          elevation={3}
          sx={{
            m: 0,
            p: 2,
            borderWidth: 0,
            borderTopWidth: 1,
          }}
        >
          <div
            style={{
              fontFamily: 'SF Pro Display-Bold, Helvetica',
              fontSize: '30px',
              fontWeight: '450',
              marginLeft: '10px',
            }}
          >
            <div>
              Renew {firstname} {lastname}
            </div>
          </div>
          <DialogContentText
            style={{
              fontFamily: 'SF Pro Display-Bold, Helvetica',
              fontSize: '18px',
              marginLeft: '10px',
            }}
          >
            Are you sure you want to send a renewal to {firstname} {lastname}?
          </DialogContentText>
        </Paper>
        <Container component="main" sx={{ pt: 4 }}>
          <Typography sx={{ marginBottom: 2 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus
            dolor purus non enim praesent elementum facilisis leo vel. Risus at
            ultrices mi tempus imperdiet.
          </Typography>
          <Typography sx={{ marginBottom: 2 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus
            dolor purus non enim praesent elementum facilisis leo vel. Risus at
            ultrices mi tempus imperdiet.ggLorem ipsum dolor sit amet,
            consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
            labore et dolore magna aliqua. Rhoncus dolor purus non enim praesent
            elementum facilisis leo vel. Risus at ultrices mi tempus
            imperdiet.ggLorem ipsum dolor sit amet, consectetur adipiscing elit,
            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Rhoncus dolor purus non enim praesent elementum facilisis leo vel.
            Risus at ultrices mi tempus imperdiet.ggLorem ipsum dolor sit amet,
            consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
            labore et dolore magna aliqua. Rhoncus dolor purus non enim praesent
            elementum facilisis leo vel. Risus at ultrices mi tempus
            imperdiet.gg
          </Typography>
        </Container>
        <FocusTrap open disableAutoFocus disableEnforceFocus>
          <Fade appear={false} in={true}>
            <Paper
              role="dialog"
              aria-modal="false"
              elevation={12}
              sx={{
                m: 0,
                p: 2,
                borderWidth: 0,
                borderTopWidth: 1,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ width: '100%' }}
              >
                <Box>
                  <Button
                    variant="outlined"
                    style={{
                      borderRadius: '10px',
                      height: '43px',
                      width: '120px',
                      textTransform: 'none',
                      fontFamily: 'SF Pro Display-Bold, Helvetica',
                      borderColor: '#5736ac',
                      borderWidth: '4px',
                      color: '#5736ac',
                    }}
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </Button>
                </Box>

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    style={{
                      borderRadius: '10px',
                      height: '43px',
                      width: '170px',
                      textTransform: 'none',
                      fontFamily: 'SF Pro Display-Bold, Helvetica',
                      borderColor: '#5736ac',
                      borderWidth: '4px',
                      color: '#5736ac',
                    }}
                    onClick={() => {
                      setViewMessage(false);
                    }}
                  >
                    Hide Message
                  </Button>
                  <Button
                    variant="contained"
                    style={{
                      borderRadius: '10px',
                      height: '43px',
                      width: '120px',
                      textTransform: 'none',
                      fontFamily: 'SF Pro Display-Bold, Helvetica',
                      backgroundColor: '#5736ac',
                      color: '#ffffff',
                    }}
                    type="submit"
                  >
                    Send
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Fade>
        </FocusTrap>
      </Dialog>
    );

  const renderReviewDialog = () => (
    <Dialog
      style={{
        borderImage:
          'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
        boxShadow: '0px 2px 20px 4px #00000040',
        borderRadius: '20px',
        border: '2px solid',
      }}
      PaperProps={{
        style: { borderRadius: 20 },
      }}
      open={openReview}
      onClose={handleCloseDialog}
    >
      <DialogTitle
        style={{
          fontFamily: 'SF Pro Display-Medium, Helvetica',
          textAlign: 'center',
          fontSize: '35px',
          fontWeight: '540',
        }}
      >
        Review Applicant
      </DialogTitle>
      <form onSubmit={handleMoveReview}>
        <DialogContent>
          <DialogContentText
            style={{
              marginTop: '35px',
              fontFamily: 'SF Pro Display-Medium, Helvetica',
              textAlign: 'center',
              fontSize: '24px',
            }}
          >
            Are you sure you want to reevaluate this applicant?
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
            onClick={handleCloseDialog}
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
            Review
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
  const handleCardClick = () => {
    onExpandToggle();
  };

  return (
    <>
      {renderReviewDialog()}
      {renderRenewDialog()}
      <div className="applicantCardApprove1" onClick={handleCardClick}>
        {!expanded && (
          <>
            <div>
              <div className="ellipse">
                <div className="initials">
                  {firstname[0].toUpperCase() + lastname[0].toUpperCase()}
                </div>
              </div>
              <div className="ufid">Email: {uf_email}</div>
              <div className="name">
                {firstname} {lastname}
              </div>
            </div>

            <div onClick={handleOpenRenew} className="thumbsContainer1">
              <div className="applicantStatus2">
                <div className="approved2">Renew</div>
              </div>
            </div>
          </>
        )}

        {expanded && (
          <div>
            <div>
              <div className="ellipse">
                <div className="initials">
                  {firstname[0].toUpperCase() + lastname[0].toUpperCase()}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div className="name">
                  {firstname} {lastname}
                </div>

                <div onClick={handleOpenRenew} className="thumbsContainer1">
                  <div className="applicantStatus2">
                    <div className="approved2">Renew</div>
                  </div>
                </div>
                <div style={{ position: 'absolute' }}>
                  <div className="email1">{uf_email}</div>
                  <div className="number">{number}</div>
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
              <div style={{ display: 'flex', gap: '61px' }}>
                <div className="label50">Applying for:</div>
                <div>{position}</div>
              </div>

              <div style={{ display: 'flex', gap: '75px' }}>
                <div className="label50">Availability:</div>
                <div className="availability1">{availability.join(', ')}</div>
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
                  <div
                    style={{ textAlign: 'center' }}
                    className="availability1"
                  >
                    {department}
                  </div>
                </div>

                <div>
                  <div className="label50">Degree:</div>
                  <div
                    style={{ textAlign: 'center' }}
                    className="availability1"
                  >
                    {degree}
                  </div>
                </div>

                <div>
                  <div className="label50">GPA:</div>
                  <div
                    style={{ textAlign: 'center' }}
                    className="availability1"
                  >
                    {gpa}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '10px' }} className="label50">
                Qualifications:
              </div>
              <div className="availability1" style={{ marginBottom: '31px' }}>
                {qualifications}
              </div>
              <div style={{ marginBottom: '10px' }} className="label50">
                Graduate Plan:
              </div>
              <div className="availability1" style={{ marginBottom: '31px' }}>
                {plan}
              </div>
              <div style={{ marginBottom: '10px' }} className="label50">
                Resume Link:
              </div>
              {resume ? (
                <a style={{ marginBottom: '104px' }} href={resume}>
                  {resume}
                </a>
              ) : (
                <div
                  style={{
                    marginBottom: '104px',
                    fontSize: '20px',
                    color: '#9e9e9e',
                  }}
                >
                  Resume Missing
                </div>
              )}
            </div>
            <Button
              variant="outlined"
              style={{
                borderRadius: '10px',

                position: 'absolute',
                right: '20px',
                bottom: '20px',
                height: '43px',
                width: '192px',
                textTransform: 'none',
                fontFamily: 'SF Pro Display-Bold , Helvetica',
                borderColor: '#5736ac',
                color: '#5736ac',
              }}
              onClick={handleOpenReview}
            >
              Move to in Review
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default ApplicantCardAssign;
