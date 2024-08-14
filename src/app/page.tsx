import SignInForm from '@/components/SignIn/SignInForm';
import LoginLowFiWireframe from '@/components/Wireframes/LoginScreen/LoginLowFiWireframe';
import scss from './Home.module.scss';
import toast, { Toaster } from 'react-hot-toast';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';

import { TopNavBar } from '@/components/TopNavBar/TopNavBar';
import { LogInCard } from '@/components/LogInCard/LogInCard';
import styles from './style.module.css';
import Link from 'next/link';
export default function Home() {
  return (
    <>
      <Toaster />
      <div className={styles.loginlowfi}>
        <div className={styles.div2}>
          <div className={styles.overlap2}>
            <img
              className={styles.colorblockframe}
              alt="Color block frame"
              src="https://c.animaapp.com/tY2yC3Jd/img/color-block-frame.png"
            />
            <div className={styles.signintitle}>
              <p className={styles.connectingbright}>
                <span className={styles.textwrapper8}>
                  Connecting Bright Minds for a Brighter Future
                  <br />
                </span>
                <span className={styles.textwrapper9}>
                  <br />
                </span>
              </p>
              <div className={styles.signinto}>
                <div className={styles.textwrapper10}>Sign in to</div>
                <div className={styles.textwrapper11}>Course Connect</div>
              </div>
            </div>
            <div className={styles.registerheretext}>
              <p className={styles.p}>If you don’t have an account</p>
              <p className={styles.youcanregister}>
                <span className={styles.textwrapper8}>You can </span>
                <Link href="/signup" className={styles.textwrapper12}>
                  {' '}
                  {'Register here!'}{' '}
                </Link>
              </p>
            </div>

            <LogInCard className={styles.logincardinstance} />
          </div>
          <EceLogoPng className={styles.ecelogopng2} />
          <TopNavBar className={styles.topnavbarinstance} />
        </div>
      </div>
    </>
  );
}

export const metadata = {
  title: 'Course Connect',
  description: 'Hiring management for students, faculty, and administrators.',
};
