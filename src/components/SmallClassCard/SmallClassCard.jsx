// components/ClassCard.js
import React from 'react';
import Link from 'next/link';
import './style.css';

const ClassCard = ({ className, courseName, courseId }) => {
  return (
    <Link
      href={{
        pathname: `/course/${encodeURIComponent(courseId)}`,
        query: { data: courseId },
      }}
      passHref
    >
      <div className={`class ${className}`}>
        <div className="small-class-card">
          <div className="text-wrapper">{courseName}</div>
        </div>
      </div>
    </Link>
  );
};

export default ClassCard;
