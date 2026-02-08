import React from 'react';
import styles from './style.module.css';

export const Bio = ({ user, className }) => {
  return (
    <div className={`${styles.fullnameandbio} ${className}`}>
      <div className={styles.ellipse}>
        {user.displayName && (
          <div className={styles.initial}>
            {user.displayName != undefined
              ? user.displayName
                  .split(' ')
                  .map((part) =>
                    part[0] != undefined ? part[0].toUpperCase() : ''
                  )
                  .join('')
              : ''}
          </div>
        )}
      </div>
      <div>
        <div className={styles.textwrapper}> {user.displayName} </div>
        <div className={styles.div}>{user.email}</div>
      </div>
    </div>
  );
};
