import React from 'react';
import './style.css';
import Link from 'next/link';

export const TopNavBar = ({ className }) => {
  return (
    <div className={`top-nav-bar ${className}`}>
      <Link href="/about">
        <div className="text-wrapper-3">About</div>
      </Link>
      <button className="logout-button">
        <div className="overlap-group">
          <Link href="/dashboard">
            <div className="text-wrapper-4">Home</div>
          </Link>
        </div>
      </button>
    </div>
  );
};
