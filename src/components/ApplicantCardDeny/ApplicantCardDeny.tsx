import { FunctionComponent, useCallback } from 'react';
import './style.css';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';


interface ApplicantCardProps {
  uf_email: string;
  firstname: string;
  lastname: string;
}
const ApplicantCardDeny: FunctionComponent<ApplicantCardProps> = ({
  uf_email,
  firstname,
  lastname,
}) => {
  const onapplicantCardDenyClick = useCallback(() => {
    // Add your code here
  }, []);

  const onThumbUpClick = useCallback(() => {
    // Add your code here
  }, []);

  const onThumbDownIconClick = useCallback(() => {
    // Add your code here
  }, []);

  return (
    <div
      className="applicantCardDeny1"
      onClick={onapplicantCardDenyClick}
    >
      <div>
        <div className="ellipse" />
        <div className="ufid">Email: {uf_email}</div>
        <div className="name">{firstname} {lastname}</div>
      </div>
      {/* Thumbs up and down icons */}
      <div className="thumbsContainer">
        <div className="applicantStatus">
          <div className="deny">Denied</div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantCardDeny;
