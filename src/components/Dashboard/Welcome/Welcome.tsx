import { Toaster } from 'react-hot-toast';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';
import { DashboardCard } from '@/components/DashboardCard/DashboardCard';
import { Bio } from '@/components/Bio/Bio';
import { TopNavBarSigned } from '@/components/TopNavBarSigned/TopNavBarSigned';
import styles from './style.module.css';
import { VerifyEmailCard } from '@/components/VerifyEmailCard/VerifyEmailCard';
import Link from 'next/link';

interface DashboardProps {
  user: any;
  userRole: string;
  emailVerified: any;
}

export default function DashboardWelcome(props: DashboardProps) {
  const { userRole, user, emailVerified } = props;
  return (
    <>
      <Toaster />
      <div className={styles.studentlandingpage}>
        <div className={styles.overlapwrapper}>
          {!emailVerified && userRole != 'admin' && (
            <div className={styles.overlap}>
              <div className={styles.overlap2}>
                <div className={styles.colorblockframe}>
                  <div className={styles.overlapgroup2}>
                    <div className={styles.colorblock} />
                    <img
                      className={styles.GRADIENTS}
                      alt="Gradients"
                      src="https://c.animaapp.com/vYQBTcnO/img/gradients.png"
                    />
                    <div className={styles.glasscard} />
                  </div>
                </div>
                <EceLogoPng className={styles.ecelogopng2} />
                <Bio user={user} className={styles.fullnameandbioinstance} />
                <TopNavBarSigned className={styles.topnavbarsignedin} />
                <div className={styles.textwrapper8}>Home</div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                  }}
                >
                  <div style={{ marginTop: '550px' }}>
                    {' '}
                    <VerifyEmailCard email={user.email} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {(userRole == 'student_applying' || userRole == 'Student') &&
            emailVerified && (
              <div className={styles.overlap}>
                <div className={styles.overlap2}>
                  <div className={styles.colorblockframe}>
                    <div className={styles.overlapgroup2}>
                      <div className={styles.colorblock} />
                      <img
                        className={styles.GRADIENTS}
                        alt="Gradients"
                        src="https://c.animaapp.com/vYQBTcnO/img/gradients.png"
                      />
                      <div className={styles.glasscard} />
                    </div>
                  </div>
                  <EceLogoPng className={styles.ecelogopng2} />
                  <Bio user={user} className={styles.fullnameandbioinstance} />
                  <TopNavBarSigned className={styles.topnavbarsignedin} />
                  <div className={styles.textwrapper8}>Home</div>
                </div>
                <div className={styles.container}>
                  <Link href="/Apply">
                    <DashboardCard
                      text="Apply"
                      image="https://c.animaapp.com/vYQBTcnO/img/apply@2x.png"
                      className={styles}
                    />
                  </Link>
                  <Link href="/Profile">
                    <DashboardCard
                      text="Profile"
                      className={styles}
                      image="https://c.animaapp.com/vYQBTcnO/img/profile@2x.png"
                    />
                  </Link>
                </div>
              </div>
            )}
          {userRole == 'unapproved' && emailVerified && (
            <div className={styles.overlap}>
              <div className={styles.overlap2}>
                <div className={styles.colorblockframe}>
                  <div className={styles.overlapgroup2}>
                    <div className={styles.colorblock} />
                    <img
                      className={styles.GRADIENTS}
                      alt="Gradients"
                      src="https://c.animaapp.com/vYQBTcnO/img/gradients.png"
                    />
                    <div className={styles.glasscard} />
                  </div>
                </div>
                <EceLogoPng className={styles.ecelogopng2} />
                <Bio user={user} className={styles.fullnameandbioinstance} />
                <TopNavBarSigned className={styles.topnavbarsignedin} />
                <div className={styles.textwrapper8}>Home</div>
              </div>

              <div
                style={{
                  width: 677,
                  height: 250,
                  paddingTop: 24,
                  paddingBottom: 24,
                  paddingLeft: 75,
                  paddingRight: 75,
                  background: 'white',
                  boxShadow: '0px 4px 35px rgba(0, 0, 0, 0.08)',
                  borderRadius: 40,
                  overflow: 'hidden',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: 110,
                  display: 'inline-flex',
                  position: 'absolute',
                  top: '640px',
                  left: '48%',
                  transform: 'translateX(-50%)',
                }}
              >
                <div
                  style={{
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 23,
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      color: '#562EBA',
                      fontSize: 32,
                      fontFamily: 'SF Pro Display',
                      fontWeight: '700',
                      wordWrap: 'break-word',
                    }}
                  >
                    Waiting on Admin Approval
                  </div>
                  <div
                    style={{
                      width: 527,
                      color: 'black',
                      fontSize: 20,
                      fontFamily: 'SF Pro Display',
                      fontWeight: '400',
                      wordWrap: 'break-word',
                    }}
                  >
                    Thank you for signing up for Course Connect as a faculty
                    member. Your account request is currently pending approval
                    by the administrator. You will receive an email notification
                    once your account has been approved or denied.
                  </div>
                </div>
              </div>
            </div>
            //  <div style = {{display: "flex", justifyContent: "center", marginTop:"606px"}}>
          )}

          {(userRole == 'student_applied' ||
            userRole == 'student_accepted' ||
            userRole == 'student_denied') &&
            emailVerified && (
              <div className={styles.overlap}>
                <div className={styles.overlap2}>
                  <div className={styles.colorblockframe}>
                    <div className={styles.overlapgroup2}>
                      <div className={styles.colorblock} />
                      <img
                        className={styles.GRADIENTS}
                        alt="Gradients"
                        src="https://c.animaapp.com/vYQBTcnO/img/gradients.png"
                      />
                      <div className={styles.glasscard} />
                    </div>
                  </div>
                  <EceLogoPng className={styles.ecelogopng2} />
                  <Bio user={user} className={styles.fullnameandbioinstance} />
                  <TopNavBarSigned className={styles.topnavbarsignedin} />
                  <div className={styles.textwrapper8}>Home</div>
                </div>
                <div className={styles.container}>
                  <Link href="/Status">
                    <DashboardCard
                      text="Status"
                      image="https://c.animaapp.com/VgdBzw39/img/status-1@2x.png"
                      className={styles}
                    />
                  </Link>
                  <Link href="/Apply">
                    <DashboardCard
                      text="Apply"
                      image="https://c.animaapp.com/vYQBTcnO/img/apply@2x.png"
                      className={styles}
                    />
                  </Link>
                  <Link href="/Profile">
                    <DashboardCard
                      className={styles}
                      text="Profile"
                      image="https://c.animaapp.com/vYQBTcnO/img/profile@2x.png"
                    />
                  </Link>
                </div>
              </div>
            )}

          {userRole == 'faculty' && emailVerified && (
            <div className={styles.overlap}>
              <div className={styles.overlap2}>
                <div className={styles.colorblockframe}>
                  <div className={styles.overlapgroup2}>
                    <div className={styles.colorblock} />
                    <img
                      className={styles.GRADIENTS}
                      alt="Gradients"
                      src="https://c.animaapp.com/vYQBTcnO/img/gradients.png"
                    />
                    <div className={styles.glasscard} />
                  </div>
                </div>
                <EceLogoPng className={styles.ecelogopng2} />
                <Bio user={user} className={styles.fullnameandbioinstance} />
                <TopNavBarSigned className={styles.topnavbarsignedin} />
                <div className={styles.textwrapper8}>Home</div>
              </div>
              <div className={styles.container}>
                <Link href="/Applications">
                  <DashboardCard
                    className={styles}
                    image="https://c.animaapp.com/ebG6M1rL/img/apply.svg"
                    text="Applications"
                  />
                </Link>
                <Link href="/Courses">
                  <DashboardCard
                    className={styles}
                    image="https://c.animaapp.com/lmfJ7wLf/img/apply@2x.png"
                    text="Courses"
                  />
                </Link>
                <Link
                  href={{
                    pathname: '/faculty',
                    query: { id: 'JWqJHybgfKMIcR0Nci3W' },
                  }}
                >
                  <DashboardCard
                    className={styles}
                    image="https://c.animaapp.com/ebG6M1rL/img/apply.svg"
                    text="Stats"
                  />
                </Link>
                <Link href="/Profile">
                  <DashboardCard
                    className={styles}
                    image="https://c.animaapp.com/vYQBTcnO/img/profile@2x.png"
                    text="Profile"
                  />
                </Link>
              </div>
            </div>
          )}

          {userRole == 'admin' && (
            <div className={styles.overlap}>
              <div className={styles.overlap2}>
                <div className={styles.colorblockframe}>
                  <div className={styles.overlapgroup2}>
                    <div className={styles.colorblock} />
                    <img
                      className={styles.GRADIENTS}
                      alt="Gradients"
                      src="https://c.animaapp.com/vYQBTcnO/img/gradients.png"
                    />
                    <div className={styles.glasscard} />
                  </div>
                </div>
                <EceLogoPng className={styles.ecelogopng2} />
                <Bio user={user} className={styles.fullnameandbioinstance} />
                <TopNavBarSigned className={styles.topnavbarsignedin} />
                <div className={styles.textwrapper8}>Home</div>
              </div>
              <div className={styles.container}>
                <Link href="/users">
                  <DashboardCard
                    className={styles}
                    image="https://c.animaapp.com/PWgYNV8T/img/group@2x.png"
                    text="Users"
                  />
                </Link>
                <Link href="/admincourses">
                  <DashboardCard
                    className={styles}
                    image="https://c.animaapp.com/PWgYNV8T/img/apply@2x.png"
                    text="Courses"
                  />
                </Link>
                <Link href="/adminApplications">
                  <DashboardCard
                    className={styles}
                    image="https://c.animaapp.com/PWgYNV8T/img/apply-1@2x.png"
                    text="Assign"
                  />
                </Link>
                <DashboardCard
                  className={styles}
                  image="https://c.animaapp.com/PWgYNV8T/img/calendar-clock@2x.png"
                  text="Scheduling"
                  clickable={true}
                />
                <Link href="facultyStats">
                  <DashboardCard
                    className={styles}
                    image="https://c.animaapp.com/PWgYNV8T/img/badge@2x.png"
                    text="Faculty Stats"
                  />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
