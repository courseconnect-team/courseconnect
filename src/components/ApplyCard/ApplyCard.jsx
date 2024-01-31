import PropTypes from "prop-types";
import React from "react";
import "./style.css";

export const ApplyCard = ({ className, apply = "https://c.animaapp.com/vYQBTcnO/img/apply-1@2x.png" }) => {
  return (
    <div className={`apply ${className}`}>
      <div className="inner-content-2">
        <img className="img-2" alt="Apply" src={apply} />
        <div className="text-wrapper-7">Apply</div>
      </div>
    </div>
  );
};

ApplyCard.propTypes = {
  apply: PropTypes.string,
};

