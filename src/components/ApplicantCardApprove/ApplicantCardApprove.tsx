import { FunctionComponent, useCallback } from 'react';
import './style.css';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';


interface ApplicantCardProps {
  uf_email: string;
  firstname: string;
  lastname: string;
}
const ApplicantCardApprove: FunctionComponent<ApplicantCardProps> = ({
  uf_email,
  firstname,
  lastname,
}) => {
  const onApplicantCardApproveClick = useCallback(() => {
    // Add your code here
  }, []);

  

  return (
    <div
      className="applicantCardApprove1"
      onClick={onApplicantCardApproveClick}
    >
      <div>
        <div className="ellipse" />
        <div className="ufid">Email: {uf_email}</div>
        <div className="name">{firstname} {lastname}</div>
      </div>
      {/* Thumbs up and down icons */}
      <div className="thumbsContainer1">
        <div className="applicantStatus3">
          <div className="approved1">Approved</div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantCardApprove;
