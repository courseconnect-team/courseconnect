'use client';
import { FunctionComponent, useCallback } from 'react';
import Image from 'next/image';
import styles from './LoginLowFiWireframe.module.css';

const LoginLowFiWireframe: FunctionComponent = () => {
  const onYouCanRegisterClick = useCallback(() => {
    // Please sync "sign-up Low-fi wireframe" to the project
  }, []);

  const onSignInButtonClick = useCallback(() => {
    // Please sync "Student landing page - applying" to the project
  }, []);

  const onLogInButtonClick = useCallback(() => {
    // Please sync "About Page 1" to the project
  }, []);

  return (
    <div className={styles.loginLowFiWireframe}>
      <Image
        className={styles.colorBlockFrame}
        alt=""
        src="/color-block-frame.svg"
        width={1440}
        height={458}
      />
      <div className={styles.signInTitle}>
        <div className={styles.connectingBrightMindsContainer}>
          <p className={styles.connectingBrightMinds}>
            Connecting Bright Minds for a Brighter Future
          </p>
          <p className={styles.blankLine}>&nbsp;</p>
        </div>
        <div className={styles.signInTo}>
          <div className={styles.signInTo1}>{`Sign in to `}</div>
          <b className={styles.courseConnect}>Course Connect</b>
        </div>
      </div>
      <div className={styles.registerHereText}>
        <div className={styles.ifYouDont}>
          If you don’t have an account register
        </div>
        <div
          className={styles.youCanRegisterContainer}
          onClick={onYouCanRegisterClick}
        >
          <span>{`You can `}</span>
          <b>Register here !</b>
        </div>
      </div>
      <div className={styles.loginLowFiWireframeChild} />
      <div className={styles.logInCard}>
        <div className={styles.logInCardChild} />
        <div className={styles.welcomeToCourseContainer}>
          <span>{`Welcome to `}</span>
          <b className={styles.courseConnect1}>Course Connect</b>
        </div>
        <div className={styles.signIn}>Sign in</div>
        <div className={styles.emailAddressInput}>
          <div className={styles.enterEmailAddress}>Enter email address</div>
          <div className={styles.emailInput}>
            <div className={styles.usernameInput} />
            <div className={styles.emailAddress}>Email address</div>
          </div>
        </div>
        <div className={styles.passwordInput}>
          <div className={styles.enterEmailAddress}>Enter password</div>
          <div className={styles.emailInput}>
            <div className={styles.usernameInput} />
            <div className={styles.emailAddress}>Password</div>
          </div>
        </div>
        <div className={styles.forgotPassword}>Forgot Password</div>
        <div className={styles.signInButton} onClick={onSignInButtonClick}>
          <div className={styles.signInButtonChild} />
          <div className={styles.signIn1}>Sign in</div>
        </div>
      </div>
      <div className={styles.eceLogoPng2}>
        <Image
          className={styles.eceLogoPng21}
          alt=""
          src="/ece-logo.png"
          width={68}
          height={50}
        />
      </div>
      <div className={styles.topNavBar}>
        <div className={styles.signInButton1}>
          <div className={styles.signInButtonItem} />
          <b className={styles.login}>Login</b>
        </div>
        <div className={styles.logInButton} onClick={onLogInButtonClick}>
          <b className={styles.about}>About</b>
        </div>
      </div>
    </div>
  );
};

export default LoginLowFiWireframe;
