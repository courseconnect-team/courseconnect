import PropTypes from 'prop-types';
import React from 'react';
import './style.css';

import { toast } from 'react-hot-toast';
import { useAuth } from '@/firebase/auth/auth_context';

export const VerifyEmailCard = ({ email }) => {
  const { user } = useAuth();
  return (
    <div className="status-card2">
      <div className="overlap">
        <div className="inner-content">
          <div className="text-wrapper-6">Verify Email</div>
        </div>
        <div className={`coarse-assistant-wrapper`}>
          <div className="text-wrapper-7">
            We have sent a verification email to{' '}
          </div>
        </div>
        <div className="overlap-2">
          <div className="div-wrapper">
            <div
              style={{
                color: '#6c6c6c',
                fontSize: '18px',
                marginTop: '7px',
                marginLeft: '-1px',
              }}
            >
              {email}
            </div>
          </div>
        </div>
        <div className={`coarse-assistant-wrapper2`}>
          <div className="text-wrapper-8">
            Please verify your email to continue...{' '}
          </div>
        </div>
        <div className={`coarse-assistant-wrapper3`}>
          <div className="text-wrapper-9">
            Didn&apos;t get the verification email?{' '}
          </div>
        </div>
        <div className="overlap-2">
          <div className="div-wrapper">
            <div
              onClick={(e) =>
                user
                  .sendEmailVerification()
                  .then(function () {
                    // Email verification sent
                    toast.success('Resent Verification Email!');
                  })
                  .catch(function (error: any) {
                    console.error(error);
                  })
              }
              className="verification"
            >
              {' '}
              Resend Verification Email
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

VerifyEmailCard.propTypes = {
  email: PropTypes.string,
};
