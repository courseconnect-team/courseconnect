import React from 'react';
import Link from 'next/link';
import './style.css';

const SmallClassCard = ({
  className,
  courseName,
  courseId,
  pathname,
  onGoing,
}) => {
  return (
    <Link
      href={{
        pathname: pathname,
        query: { courseId, onGoing },
      }}
      prefetch={false}
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
