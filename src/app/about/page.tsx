import SignInForm from '@/components/SignIn/SignInForm';
import scss from './Home.module.scss';
import toast, { Toaster } from 'react-hot-toast';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';
import { TopNavBar } from '@/components/TopNavBar/TopNavBar';
import { LogInCard } from '@/components/LogInCard/LogInCard';
import styles from "./style.module.css";
import Link from 'next/link';
import { SignUpCard } from '@/components/SignUpCard/SignUpCard';
import { Card } from '@/components/Card/Card'
export default function About() {
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
                <div className={styles.textwrapper10}>Welcome to</div>
                <div className={styles.textwrapper11}>Course Connect</div>
              </div>
            </div>
            <div className={styles.registerheretext}>
              <p className={styles.p}>Course Connect is your all-in-one solution for managing the TA, PI, and grader processes. Whether you are a student looking for opportunities, a faculty member seeking to streamline your workflow, or an administrator in charge of overseeing the entire system, Course Connect offers the features and functionality you need to succeed.</p>
            </div>

          </div>
          <EceLogoPng className={styles.ecelogopng2} />
          <TopNavBar
            className={styles.topnavbarinstance}
            divClassName={styles.designcomponentinstancenode}
            divClassNameOverride={styles.topnavbar3}
            logInButtonClassName={styles.topnavbar2}
          />
          <EceLogoPng className={styles.ecelogopng2} />
        </div>
        <div className={styles.sectionaboutus}>
          <div className={styles.aboutus}>
            <img className={styles.img2} alt="Line" src="https://c.animaapp.com/1tYHWIVt/img/line-1-1.svg" />
            <div className={styles.textwrapper6}>Features</div>
            <img className={styles.img} alt="Line" src="https://c.animaapp.com/1tYHWIVt/img/line-1-1.svg" />
          </div>
          <Card
            className={styles.studentcard}
            rectangleClassName={styles.designcomponentinstancenode}
            text="As a student, Course Connect provides you with the opportunity to apply for TA, PI, or grader positions. Submit your application through our intuitive interface and keep track of its status. You&#39;ll receive notifications when you are assigned to a course, ensuring that you stay informed every step of the way. Once assigned, you can easily access and view your course(s) as an employee, making it convenient to manage your responsibilities."
            text1="Students"
            imgLink="https://github.com/MrinallU/ccimgs/blob/main/ufstudents.png?raw=True"
          />
          <Card
            className={styles.facultycard2}
            rectangleClassName={styles.designcomponentinstancenode}
            text="Course Connect empowers faculty members to effortlessly handle the application process for TA, PI, and grader positions. Receive applications from students, view them within our user-friendly platform, and make informed decisions by accepting or denying them. Furthermore, you can access a comprehensive overview of your course(s), including enrollment and other essential statistics. Stay organized with Course Connect."
            text1="Faculty"
            imgLink="https://github.com/MrinallU/ccimgs/blob/main/uf%20faculty%201.png?raw=true"
          />
          <Card
            className={styles.administratorcard2}
            rectangleClassName={styles.designcomponentinstancenode}
            text="Course Connect simplifies the administrative tasks associated with managing users, courses, and applications. Our platform provides a centralized database with real-time connections, allowing administrators to efficiently create, view, update, and delete users, courses, and applications through neat tables. Accessing vital statistics about users, courses, and applications is just a click away."
            text1="Administrators"
            imgLink="https://github.com/MrinallU/ccimgs/blob/main/uf%20admin%201.png?raw=true"
          />
        </div>

      </div>
    </>
  );
}

export const metadata = {
  title: 'Course Connect',
  description: 'Hiring management for students, faculty, and administrators.',
};
