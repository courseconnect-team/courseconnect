import PropTypes from 'prop-types';
import React from 'react';
import './style.css';

export const Card = ({
  className = '',
  text = 'As a student, Course Connect provides you with the opportunity to apply for TA, PI, or grader positions. Submit your application through our intuitive interface and keep track of its status. You&#39;ll receive notifications when you are assigned to a course, ensuring that you stay informed every step of the way. Once assigned, you can easily access and view your course(s) as an employee, making it convenient to manage your responsibilities.',
  rectangleClassName,
  imgLink,
  text1 = 'Student',
}) => {
  return (
    <div className={`card ${className}`}>
      <div className="inner-content">
        <p className={`as-a-student-course`}>{text}</p>
        <div className="student">{text1}</div>
      </div>
      <iframe
        className="rectangle"
        src={imgLink}
        title="Course Connect Student"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    </div>
  );
};

Card.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string,
  text1: PropTypes.string,
};
