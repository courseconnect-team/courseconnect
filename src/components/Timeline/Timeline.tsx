import React from 'react';
import './style.css';

interface TimelineProps {
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
}

export const Timeline = ({
  selectedYear,
  setSelectedYear,
}: TimelineProps): JSX.Element => {
  return (
    <div className="tab-bar">
      <div
        className={`element-year ${selectedYear === 1 ? 'selected' : ''}`}
        onClick={() => setSelectedYear(1)}
      >
        <div className="div">
          <div className="text-wrapper">1</div>
          <div className="text-wrapper-2">year ago</div>
        </div>
      </div>
      <div
        className={`element-years ${selectedYear === 2 ? 'selected' : ''}`}
        onClick={() => setSelectedYear(2)}
      >
        <div className="div">
          <div className="text-wrapper-3">2</div>
          <div className="text-wrapper-4">year ago</div>
        </div>
      </div>
      <div
        className={`element-years ${selectedYear === 3 ? 'selected' : ''}`}
        onClick={() => setSelectedYear(3)}
      >
        <div className="div">
          <div className="text-wrapper-3">3</div>
          <div className="text-wrapper-4">year ago</div>
        </div>
      </div>
    </div>
  );
};
