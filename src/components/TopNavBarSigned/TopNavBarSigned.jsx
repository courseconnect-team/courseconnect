import React from "react";
import "./style.css";
import Link from "next/link";

import handleSignOut from '@/firebase/auth/auth_signout';
export const TopNavBarSigned = ({ className }) => {
  return (
    <div className={`top-nav-bar-signed ${className}`}>
      <Link href="/about">
        <div className="text-wrapper-3">About</div>
      </Link>

      <Link href="/">
        <div className="text-wrapper-4">Home</div>
      </Link>

      <button className="logout-button" onClick={() => handleSignOut()}>
        <div className="overlap-group">
          <div className="text-wrapper-5">Logout</div>
        </div>
      </button>
    </div>
  );
};

