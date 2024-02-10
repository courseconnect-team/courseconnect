import PropTypes from "prop-types";
import React from "react";
import "./style.css";

export const StatusCard = ({ className, apply = "https://c.animaapp.com/vYQBTcnO/img/apply-1@2x.png" }) => {
  return (
    <div className={`apply ${className}`}>
      <div className="inner-content-2">
        <img className="img-3" alt="Apply" src={apply} />
        <div className="text-wrapper-7">Status</div>
      </div>
    </div>
  );
};

StatusCard.propTypes = {
  apply: PropTypes.string,
};

