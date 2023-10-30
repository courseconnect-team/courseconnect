import React from "react";
import "./style.css";

export const TopNavBarSigned = ({ className }) => {
  return (
    <div className={`top-nav-bar-signed ${className}`}>
      <div className="text-wrapper-3">About</div>
      <div className="text-wrapper-4">Home</div>
      <button className="logout-button">
        <div className="overlap-group">
          <div className="text-wrapper-5">Logout</div>
        </div>
      </button>
    </div>
  );
};

