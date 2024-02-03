'use client';
import React from 'react';
import Container from '@mui/material/Container';
import UnderDevelopment from '@/components/UnderDevelopment';
import DeleteUserButton from './DeleteUserButton';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';
import { TopNavBarSigned } from '@/components/TopNavBarSigned/TopNavBarSigned';

import "./style.css";
interface ProfileProps {
  userRole: string;
  user: any;
}

export default function Profile(props: ProfileProps) {
  const { userRole, user } = props;
  // Add state to control the dialog open status
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="student-landing-page">
        <div className="overlap-wrapper">
          <div className="overlap">
            <div className="overlap-2">
              <div className="color-block-frame">
                <div className="overlap-group-2">
                  <div className="color-block" />
                  <img className="GRADIENTS" alt="Gradients" src="https://c.animaapp.com/vYQBTcnO/img/gradients.png" />
                  <div className="glass-card" />
                </div>
              </div>
              <EceLogoPng className="ece-logo-png-2" />
              <TopNavBarSigned className="top-nav-bar-signed-in" />
              <div className="text-wrapper-8">Profile</div>
            </div>
            <Container className="profile-instance" component="main" maxWidth="md">
              <DeleteUserButton open={open} setOpen={setOpen} />
            </Container>
          </div>
        </div>
      </div>
    </>

  );
}
