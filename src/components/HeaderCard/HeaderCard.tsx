// components/HeaderCard/HeaderCard.tsx
import React, { FC } from 'react';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';
import { TopNavBarSigned } from '@/components/TopNavBarSigned/TopNavBarSigned';
import './style.css';
import Breadcrumb from '../Breadcrumb/Breadcrumb';

interface HeaderCardProps {
  text: string;
}

const HeaderCard: FC<HeaderCardProps> = ({ text }) => {
  return (
    <div className="header">
      <div className="overlap-wrapper">
        <div className="overlap">
          <div className="overlap-2">
            <div className="color-block-frame">
              <div className="overlap-group-2">
                <div className="color-block" />
                <img
                  className="GRADIENTS"
                  alt="Gradients"
                  src="https://c.animaapp.com/vYQBTcnO/img/gradients.png"
                />
                <div className="glass-card" />
              </div>
            </div>
          </div>
          <EceLogoPng className="ece-logo-png-2" />
          <TopNavBarSigned className="top-nav-bar-signed-in" />
          <div className="text-wrapper-10">{text}</div>
        </div>
      </div>
      <div className="crumbs">
        <Breadcrumb />
      </div>
    </div>
  );
};

export default HeaderCard;
