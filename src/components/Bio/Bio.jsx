import React from "react";
import "./style.css";

export const Bio = ({ user, className }) => {
  console.log(user)
  console.log(user.displayName)
  return (
    <div className={`full-name-and-bio ${className}`}>
      <div className="ellipse" />
      <div className="text-wrapper"> {user.displayName} </div>
      <div className="div">{user.email}</div>
    </div>
  );
};

