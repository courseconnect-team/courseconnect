import React from "react";
import styles from "./style.module.css";

export const Bio = ({ user, className }) => {
  console.log(user)
  console.log(user.displayName)
  return (
    <div className={`${styles.fullnameandbio} ${className}`}>
      <div className={styles.ellipse}>

      {user.displayName &&

          <div className={styles.initial}>{user.displayName.split(' ').map(part => part[0]).join('')}</div>
        }
      </div>

      <div className={styles.textwrapper}> {user.displayName} </div>
      <div className={styles.div}>{user.email}</div>
    </div>
  );
};

