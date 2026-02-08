import React from 'react';
import './style.css';

export const CourseCard = ({
  className,
  course = 'https://c.animaapp.com/lmfJ7wLf/img/apply@2x.png',
}) => {
  return (
    <div className={`course ${className}`}>
      <div className="inner-content">
        <div className="text-wrapper-6">Courses</div>
        <img className="img" alt="Apply" src={course} />
      </div>
    </div>
  );
};
