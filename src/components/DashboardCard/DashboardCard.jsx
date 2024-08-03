import PropTypes from 'prop-types';
import React from 'react';
import './style.css';
export const DashboardCard = ({ className, image, text }) => {
  return (
    <div className={`card ${className}`}>
      <div className="innercontent2">
        <img className="img2" alt="Card" src={image} />
        <div className="text-wrapper-6">{text}</div>
      </div>
    </div>
  );
};

DashboardCard.propTypes = {
  image: PropTypes.string,
  text: PropTypes.string,
  clickable: PropTypes.bool,
};
