import PropTypes from 'prop-types';
import React from 'react';
import './style.css';

export const ApplicationStatusCardDenied = ({ text, course, className }) => {
  return (
    <div className={`status-card ${className}`}>
      <div className="overlap">
        <div className="inner-content">
          <div className="text-wrapper-6">Application</div>
        </div>
        <div className={`coarse-assistant-wrapper`}>
          <div className="text-wrapper-7">{text}</div>
        </div>
        <div className="overlap-2">
          <div className="div-wrapper">
            <div
              style={{
                color: '#6c6c6c',
                marginTop: '5px',
                marginLeft: '-99px',
              }}
            >
              {course}
            </div>
          </div>
          <div className="rectangle" />
        </div>
      </div>
      <div className="inner-content-2">
        <div className="text-wrapper-7">Status:</div>
      </div>
      <div className="application-button">
        <div className="overlap-group-2">
          <div className="text-wrapper-10">Application Denied</div>
        </div>
      </div>
    </div>
  );
};

ApplicationStatusCardDenied.propTypes = {
  text: PropTypes.string,
  course: PropTypes.string,
  className: PropTypes.string,
};

ApplicationStatusCardDenied.defaultProps = {
  className: '', // Default to an empty string if no class is provided
};
