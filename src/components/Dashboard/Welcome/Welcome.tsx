import Container from '@mui/material/Container';
import UnderDevelopment from '@/components/UnderDevelopment';
import { Toaster } from 'react-hot-toast';
import { ApplyCard } from "@/components/ApplyCard/ApplyCard";
import { StatusCard } from "@/components/StatusCard/StatusCard";
import { EceLogoPng } from "@/components/EceLogoPng/EceLogoPng";
import { DashboardCard } from "@/components/DashboardCard/DashboardCard";
import { Bio } from "@/components/Bio/Bio";
import { Profile } from "@/components/Profile/Profile";
import { TopNavBarSigned } from "@/components/TopNavBarSigned/TopNavBarSigned";
import styles from "./style.module.css";
import Link from 'next/link';
interface DashboardProps {
  user: any;
  userRole: string;
  emailVerified: any;
}

export default function DashboardWelcome(props: DashboardProps) {
  const { userRole, user, emailVerified } = props;
  console.log(userRole)
  return (
    <>
      <Toaster />
      <div className={styles.studentlandingpage}>
        <div className={styles.overlapwrapper}>
          {(!emailVerified) && userRole != "admin" &&
            <div className={styles.overlap}>
              <div className={styles.overlap2}>
                <div className={styles.colorblockframe}>
                  <div className={styles.overlapgroup2}>
                    <div className={styles.colorblock} />
                    <img className={styles.GRADIENTS} alt="Gradients" src="https://c.animaapp.com/vYQBTcnO/img/gradients.png" />
                    <div className={styles.glasscard} />
                  </div>
                </div>
                <EceLogoPng className={styles.ecelogopng2} />
                <Bio user={user} className={styles.fullnameandbioinstance} />
                <TopNavBarSigned className={styles.topnavbarsignedin} />
                <div className={styles.textwrapper8}>Home</div>
                <div style={{ marginTop: "650px", marginLeft: "40%" }}>
                  <h1 >Email Verification Required</h1>
                  <p>Please check your email for a verification link.</p>
                </div>
              </div>



            </div>

          }
          {(userRole == "student_applying" || userRole == "Student") && emailVerified &&
            <div className={styles.overlap}>
              <div className={styles.overlap2}>
                <div className={styles.colorblockframe}>
                  <div className={styles.overlapgroup2}>
                    <div className={styles.colorblock} />
                    <img className={styles.GRADIENTS} alt="Gradients" src="https://c.animaapp.com/vYQBTcnO/img/gradients.png" />
                    <div className={styles.glasscard} />
                  </div>
                </div>
                <EceLogoPng className={styles.ecelogopng2} />
                <Bio user={user} className={styles.fullnameandbioinstance} />
                <TopNavBarSigned className={styles.topnavbarsignedin} />
                <div className={styles.textwrapper8}>Home</div>
              </div>
              <Link href="/Profile">
                <Profile className={styles.profileinstance} profile="https://c.animaapp.com/vYQBTcnO/img/profile@2x.png" />
              </Link>
              <Link href="/apply">

                <ApplyCard apply="https://c.animaapp.com/vYQBTcnO/img/apply@2x.png" className={styles.applyinstance} />
              </Link>

            </div>
          }

          {(userRole == "student_applied" || userRole == 'student_accepted' || userRole == "student_denied") && emailVerified &&
            <div className={styles.overlap}>
              <div className={styles.overlap2}>
                <div className={styles.colorblockframe}>
                  <div className={styles.overlapgroup2}>
                    <div className={styles.colorblock} />
                    <img className={styles.GRADIENTS} alt="Gradients" src="https://c.animaapp.com/vYQBTcnO/img/gradients.png" />
                    <div className={styles.glasscard} />
                  </div>
                </div>
                <EceLogoPng className={styles.ecelogopng2} />
                <Bio user={user} className={styles.fullnameandbioinstance} />
                <TopNavBarSigned className={styles.topnavbarsignedin} />
                <div className={styles.textwrapper8}>Home</div>
              </div>
              <Link href="/Profile">
                <Profile className={styles.profileinstance2} profile="https://c.animaapp.com/vYQBTcnO/img/profile@2x.png" />
              </Link>
              <Link href="/status">
                <StatusCard apply="https://c.animaapp.com/VgdBzw39/img/status-1@2x.png" className={styles.applyinstance2} />
              </Link>
              <Link href="/apply">

                <ApplyCard apply="https://c.animaapp.com/vYQBTcnO/img/apply@2x.png" className={styles.statusinstance} />
              </Link>
            </div>

          }


          {(userRole == "admin") &&
            <div className={styles.overlap}>
              <div className={styles.overlap2}>
                <div className={styles.colorblockframe}>
                  <div className={styles.overlapgroup2}>
                    <div className={styles.colorblock} />
                    <img className={styles.GRADIENTS} alt="Gradients" src="https://c.animaapp.com/vYQBTcnO/img/gradients.png" />
                    <div className={styles.glasscard} />
                  </div>
                </div>
                <EceLogoPng className={styles.ecelogopng2} />
                <Bio user={user} className={styles.fullnameandbioinstance} />
                <TopNavBarSigned className={styles.topnavbarsignedin} />
                <div className={styles.textwrapper8}>Home</div>
              </div>
              <Link href="/users">
                <DashboardCard className={styles.users} image="https://c.animaapp.com/PWgYNV8T/img/group@2x.png" text="Users" />
              </Link>
              <Link href="/underDevelopment">
                <DashboardCard className={styles.courses} image="https://c.animaapp.com/PWgYNV8T/img/apply@2x.png" text="Courses" />
              </Link>
              <Link href="/adminApplications">
                <DashboardCard className={styles.applications} image="https://c.animaapp.com/PWgYNV8T/img/apply-1@2x.png" text="Assign" />
              </Link>
              <Link href="/underDevelopment">
                <DashboardCard className={styles.scheduling} image="https://c.animaapp.com/PWgYNV8T/img/calendar-clock@2x.png" text="Scheduling" />
              </Link>
              <Link href="/underDevelopment">
                <DashboardCard className={styles.stats} image="https://c.animaapp.com/PWgYNV8T/img/badge@2x.png" text="Faculty Stats" />
              </Link>
            </div >

          }
        </div >
      </div >
    </>
  );
}
