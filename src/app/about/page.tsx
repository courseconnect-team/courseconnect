import SignInForm from '@/components/SignIn/SignInForm';
import scss from './Home.module.scss';
import toast, { Toaster } from 'react-hot-toast';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';
import { TopNavBar } from '@/components/TopNavBar/TopNavBar';
import { LogInCard } from '@/components/LogInCard/LogInCard';
import './style.css';
import Link from 'next/link';
import { SignUpCard } from '@/components/SignUpCard/SignUpCard';
import { Card } from '@/components/Card/Card'
export default function SignUpPage() {
  return (
    <>
      <Toaster />
      <div className="login-low-fi">
        <div className="div-2">
          <div className="overlap-2">
            <img
              className="color-block-frame"
              alt="Color block frame"
              src="https://c.animaapp.com/tY2yC3Jd/img/color-block-frame.png"
            />
            <div className="sign-in-title">
              <p className="connecting-bright">
                <span className="text-wrapper-8">
                  Connecting Bright Minds for a Brighter Future
                  <br />
                </span>
                <span className="text-wrapper-9">
                  <br />
                </span>
              </p>
              <div className="sign-in-to">
                <div className="text-wrapper-10">Welcome to</div>
                <div className="text-wrapper-11">Course Connect</div>
              </div>
            </div>
            <div className="register-here-text">
              <p className="p">Course Connect is your all-in-one solution for managing the TA, PI, and grader processes. Whether you are a student looking for opportunities, a faculty member seeking to streamline your workflow, or an administrator in charge of overseeing the entire system, Course Connect offers the features and functionality you need to succeed.</p>
            </div>

          </div>
          <EceLogoPng className="ece-logo-png-2" />
          <TopNavBar
            className="top-nav-bar-instance"
            divClassName="design-component-instance-node"
            divClassNameOverride="top-nav-bar-3"
            logInButtonClassName="top-nav-bar-2"
          />
          <EceLogoPng className="ece-logo-png-2" />
        </div>
        <div className="section-about-us">
          <div className="about-us">
            <img className="img2" alt="Line" src="https://c.animaapp.com/1tYHWIVt/img/line-1-1.svg" />
            <div className="text-wrapper-6">Features</div>
            <img className="img" alt="Line" src="https://c.animaapp.com/1tYHWIVt/img/line-1-1.svg" />
          </div>
          <Card
            className="student-card"
            rectangleClassName="design-component-instance-node"
            text="As a student, Course Connect provides you with the opportunity to apply for TA, PI, or grader positions. Submit your application through our intuitive interface and keep track of its status. You&#39;ll receive notifications when you are assigned to a course, ensuring that you stay informed every step of the way. Once assigned, you can easily access and view your course(s) as an employee, making it convenient to manage your responsibilities."
            text1="Students"
            imgLink="https://github.com/MrinallU/ccimgs/blob/main/ufstudents.png?raw=True"
          />
          <Card
            className="faculty-card-2"
            rectangleClassName="design-component-instance-node"
            text="Course Connect empowers faculty members to effortlessly handle the application process for TA, PI, and grader positions. Receive applications from students, view them within our user-friendly platform, and make informed decisions by accepting or denying them. Furthermore, you can access a comprehensive overview of your course(s), including enrollment and other essential statistics. Stay organized with Course Connect."
            text1="Faculty"
            imgLink="https://github.com/MrinallU/ccimgs/blob/main/uf%20faculty%201.png?raw=true"
          />
          <Card
            className="administrator-card-2"
            rectangleClassName="design-component-instance-node"
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
