// NavBar.tsx
import React from 'react';
import './style.css';
import { EceLogoPng } from '../EceLogoPng/EceLogoPng';
import { TopNavBarSigned } from '../TopNavBarSigned/TopNavBarSigned';

const SmallHeader = () => {
  return (
    <nav className="navbar">
      <EceLogoPng className="ece-logo-png-2" />
      <TopNavBarSigned className="top-nav-bar-signed-in" />
    </nav>
  );
};

export default SmallHeader;
