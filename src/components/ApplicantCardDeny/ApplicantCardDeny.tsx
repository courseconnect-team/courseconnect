import { FunctionComponent, useCallback } from 'react';
import './style.css';

import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

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
  gpa,
  expanded: boolean;
  onExpandToggle: any;
  openReview: boolean;
  setOpenReviewDialog: (value: boolean) => void;
  currentStu: string;
  setCurrentStu: (value: string) => void;
}

const ApplicantCardDeny: FunctionComponent<ApplicantCardProps> = ({
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
  currentStu,
  setCurrentStu,
}) => {
  const db = firebase.firestore();
  const handleMoveReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const statusRef = db.collection('applications').doc(currentStu);
      let doc = await getDoc(statusRef);
      let coursesMap = doc.data().courses;
      let getQueryParams = query => {
        return query
          ? (/^[?#]/.test(query) ? query.slice(1) : query)
            .split('&')
            .reduce((params, param) => {
              let [key, value] = param.split('=');
              params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
              return params;
            }, {}
            )
          : {}
      };
      const { data } = getQueryParams(window.location.search);
      coursesMap[data] = "applied"
      console.log(coursesMap);
      await statusRef.update({ courses: coursesMap });
      console.log('Application moved successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error approving application:', error);
    }
  };

  const handleCloseReview = () => {
    setOpenReviewDialog(false);
  };

  const handleOpenReview = useCallback((event: any) => {
    event?.stopPropagation()
    setOpenReviewDialog(true);
    setCurrentStu(id);
  }, []);

  const renderReviewDialog = () => (
    <Dialog
      style={{ borderImage: "linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1", boxShadow: "0px 2px 20px 4px #00000040", borderRadius: "20px", border: "2px solid" }} PaperProps={{
        style: { borderRadius: 20 }
      }}
      open={openReview}
      onClose={handleCloseReview}
    >
      <DialogTitle
        style={{ fontFamily: "SF Pro Display-Medium, Helvetica", textAlign: "center", fontSize: "35px", fontWeight: "540" }}
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
            onClick={handleCloseReview}
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
      <div className="applicantCardDeny1" onClick={handleCardClick}>
        {!expanded && (
          <>
            <div>
              <div className="ellipse">
                <div className="initials">{firstname[0].toUpperCase() + lastname[0].toUpperCase()}</div>
              </div>
              <div className="ufid">Email: {uf_email}</div>
              <div className="name">
                {firstname} {lastname}
              </div>
            </div>

            <div className="thumbsContainer4">
              <div className="applicantStatus">
                <div className="deny">Denied</div>
              </div>
            </div>
          </>
        )}
        {expanded && (
          <div>
            <div>
              <div className="ellipse">
                <div className="initials">{firstname[0].toUpperCase() + lastname[0].toUpperCase()}</div>
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

                <div className="thumbsContainer4">
                  <div className="applicantStatus">
                    <div className="deny">Denied</div>
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
              }}
            >
              <div style={{ display: 'flex', gap: '61px' }}>
                <div className="label50">Applying for:</div>
                <div>{position}</div>
              </div>
              <div style={{ display: 'flex', gap: '61px' }}>
                <div className="label50">Semester(s):</div>
                <div>{semester}</div>
              </div>
              <div style={{ display: 'flex', gap: '75px' }}>
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
                bottom: '722px',
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

export default ApplicantCardDeny;
