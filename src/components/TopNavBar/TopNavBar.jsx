/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import "./style.css";
import Link from "next/link";

export const TopNavBar = ({
  className,
  divClassName,
  logInButtonClassName,
  divClassNameOverride
}) => {
  return (
    <div className={`top-nav-bar ${className}`}>
      <Link href="/dashboard">
        <button className="div-wrapper">
          <div className="overlap-group-2">
            <div className={`text-wrapper-6 ${divClassName}`}>Home</div>
          </div>
        </button>
      </Link>

      <Link href="/about">

        <div className={`log-in-button`}>
          <div className={`text-wrapper-7 ${divClassNameOverride}`}>About</div>
        </div>
      </Link>
    </div>
  );
};

