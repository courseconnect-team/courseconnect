import React from 'react';
import './style.css';

export const Timeline = (): JSX.Element => {
  return (
    <div className="tab-bar">
      <div className="element-year">
        <div className="div">
          <div className="text-wrapper">1</div>
          <div className="text-wrapper-2">year ago</div>
        </div>
      </div>
      <div className="element-years">
        <div className="div">
          <div className="text-wrapper-3">2</div>
          <div className="text-wrapper-4">year ago</div>
        </div>
      </div>
      <div className="element-years">
        <div className="div">
          <div className="text-wrapper-3">3</div>
          <div className="text-wrapper-4">year ago</div>
        </div>
      </div>
    </div>
  );
};
