// components/ClassCard.js
import React from 'react';
import Link from 'next/link';
import './style.css';

const SmallClassCard = ({ className, courseName, courseId, pathname }) => {
  return (
    <Link
      href={{
        pathname: pathname,
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

export default SmallClassCard;
