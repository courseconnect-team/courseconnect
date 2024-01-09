import PropTypes from "prop-types";
import React from "react";
import styles from "./style.module.css";

export const DashboardCard = ({ className, image, text }) => {
  return (
    <div className={className} >
      <div className={styles.card}>
        <div className={styles.innercontent2}>
          <img className={styles.img2} alt="Card" src={image} />

          <div>{text}</div>
        </div>
      </div>
    </div>
  );
};

DashboardCard.propTypes = {
  image: PropTypes.string,
  text: PropTypes.string,
};

