/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import "./style.css";

export const TopNavBar = ({
  className,
  divClassName,
  logInButtonClassName,
  divClassNameOverride
}) => {
  return (
    <div className={`top-nav-bar ${className}`}>
      <button className="div-wrapper">
        <div className="overlap-group-2">
          <div className={`text-wrapper-6 ${divClassName}`}>Login</div>
        </div>
      </button>
      <div className={`log-in-button`}>
        <div className={`text-wrapper-7 ${divClassNameOverride}`}>About</div>
      </div>
    </div>
  );
};

