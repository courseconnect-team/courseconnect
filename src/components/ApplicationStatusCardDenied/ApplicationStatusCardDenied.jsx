import PropTypes from "prop-types";
import React from "react";
import "./style.css";

export const ApplicationStatusCardDenied = ({ text, course }) => {
  return (
    <div className={`status-card`}>
      <div className="overlap">
        <div className="inner-content">
          <div className="text-wrapper-6">Applications</div>
        </div>
        <div className={`coarse-assistant-wrapper`}>
          <div className="text-wrapper-7">TA/UPI</div>
        </div>
        <div className="overlap-2">
          <div className="div-wrapper">
            <div style={{ color: "#6c6c6c", marginTop: "30px", marginLeft: "90px" }}>All Courses</div>
          </div>
          <div className="rectangle" />
        </div>
      </div>
      <div className="inner-content-2">
        <div className="text-wrapper-7">Status:</div>
        <div className="text-wrapper-9">Unfortunately all your applications have been denied. Please reapply using the application form.</div>
      </div>
      <div className="application-button">
        <div className="overlap-group-2">
          <div className="text-wrapper-10">Applications Denied</div>
        </div>
      </div>
    </div>
  );
};

ApplicationStatusCardDenied.propTypes = {
  text: PropTypes.string,
  course: PropTypes.string,
};

