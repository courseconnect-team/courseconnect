import React from 'react';
import './style.css';
import PropTypes from 'prop-types';

export const ApplicationsCard = ({
  className,
  applications = 'https://c.animaapp.com/vYQBTcnO/img/apply-1@2x.png',
}) => {
  return (
    <div className={`applications ${className}`}>
      <div className="inner-content-3">
        <img className="img-3" alt="Applications" src={applications} />
        <div className="text-wrapper-6">Applications</div>
      </div>
    </div>
  );
};

ApplicationsCard.propTypes = {
  applications: PropTypes.string,
};
