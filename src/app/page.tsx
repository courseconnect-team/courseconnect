import { EceLogoPng } from '@/componentsd/EceLogoPng/EceLogoPng';
import styles from './style.module.css';
import AuthSwitcher from './AuthSwitcher';
export const metadata = {
  title: 'Course Connect',
  description: 'Hiring management for students, faculty, and administrators.',
};

export default function Home() {
  return (
    <div className={styles.loginlowfi}>
      <div className={styles.div2}>
        <div className={styles.overlap2}>
          <div className="relative h-[458px] flex  text-white [background:linear-gradient(90deg,#6035ab_0%,#432577_20%,#0c0715_38%,#000000_50%,#0c0715_63%,#01534B_80%,#03ccb9_100%)]" />

          <div className={styles.signintitle}>
            <div className={styles.signinto}>
              <div className="text-h3 text-white">Welcome to</div>
              <div className="text-h2 text-white font-bold">Course Connect</div>
              <span className="text-subtitle1 text-white">
                Connecting Bright Minds for a Brighter Future
              </span>
            </div>
          </div>
          <div
            className="
    static mt-6  /* default: normal flow below the text */
    lg:absolute lg:left-[58%] lg:top-[150px] lg:mt-0 /* on large screens: float inside banner */
  "
          >
            <AuthSwitcher />
          </div>
        </div>
        <EceLogoPng className={styles.ecelogopng2} />
      </div>
    </div>
  );
}
