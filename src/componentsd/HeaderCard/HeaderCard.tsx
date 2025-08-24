// components/HeaderCard/HeaderCard.tsx
import React, { FC } from 'react';
import { EceLogoPng } from '@/componentsd/EceLogoPng/EceLogoPng';
import { TopNavBarSigned } from '@/componentsd/TopNavBarSigned/TopNavBarSigned';
import './style.css';
import Breadcrumb from '../Breadcrumb/Breadcrumb';

interface HeaderCardProps {
  text: string;
}

const HeaderCard = ({ text }: HeaderCardProps) => {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <nav className="header">
        <EceLogoPng className="ece-logo-png-2" />
        <TopNavBarSigned className="top-nav-bar-signed-in" />

        <div className="text-wrapper-10">{text}</div>
      </nav>
      <div className="crumbs">
        <Breadcrumb />
      </div>
    </div>
  );
};

export default HeaderCard;
