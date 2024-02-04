import React from "react";
import "./style.css";

export const ApplicantCard = () => {
  return (
    <div className="applicant-card">
      <div className="text-wrapper">Firstname Lastname</div>
      <div className="div">UFID: 12345678</div>
      <div className="ellipse" />
      <div className="applicant-status">
        <div className="overlap-group">
          <div className="text-wrapper-2">Denied</div>
        </div>
      </div>
    </div>
  );
};
