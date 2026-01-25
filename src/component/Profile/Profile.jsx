import PropTypes from 'prop-types';
import React from 'react';
import './style.css';

export const Profile = ({
  className,
  profile = 'https://c.animaapp.com/vYQBTcnO/img/profile-1@2x.png',
}) => {
  return (
    <div className={`profile ${className}`}>
      <div className="inner-content">
        <div className="text-wrapper-6">Profile</div>
        <img className="img" alt="Profile" src={profile} />
      </div>
    </div>
  );
};

Profile.propTypes = {
  profile: PropTypes.string,
};
