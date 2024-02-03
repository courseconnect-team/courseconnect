import SignInForm from '@/components/SignIn/SignInForm';
import scss from './Home.module.scss';
import toast, { Toaster } from 'react-hot-toast';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';

import { TopNavBar } from '@/components/TopNavBar/TopNavBar';
import { LogInCard } from '@/components/LogInCard/LogInCard';
import './style.css';
import Link from 'next/link';
import { SignUpCard } from '@/components/SignUpCard/SignUpCard';
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
                <div className="text-wrapper-10">Sign in to</div>
                <div className="text-wrapper-11">Course Connect</div>
              </div>
            </div>
            <div className="register-here-text">
              <p className="p">Already have an account?</p>
              <p className="you-can-register">
                <span className="text-wrapper-8">You can </span>
                <Link href="/" className="text-wrapper-12"> {"Login here!"} </Link>
              </p>
            </div>

            <SignUpCard className="log-in-card-instance" />
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
      </div>
    </>
  );
}

export const metadata = {
  title: 'Course Connect',
  description: 'Hiring management for students, faculty, and administrators.',
};
