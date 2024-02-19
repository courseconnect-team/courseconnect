// components/ClassCard.js
import React from 'react';
import Link from 'next/link';
import './style.css';

const ClassCard = ({ className, courseName }) => {

  return (
    <Link href={{ pathname: `/course/${encodeURIComponent(courseName)}`, query: { data: courseName } }} passHref>
      <div className={`class ${className}`} >
        <div className="class-card">
          <div className="text-wrapper">{courseName}</div>
        </div>
      </div>
    </Link>
  );
};

export default ClassCard;
