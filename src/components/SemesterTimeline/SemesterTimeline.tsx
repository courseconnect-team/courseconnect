import React from 'react';
import './style.css';

interface TimelineProps {
  selectedSemester: number;
  setSelectedSemester: React.Dispatch<React.SetStateAction<number>>;
  semesters: string[];
}

export const SemesterTimeline = ({
  selectedSemester,
  setSelectedSemester,
  semesters,
}: TimelineProps): JSX.Element => {
  return (
    <div className="tab-bar">
      <div
        className={`element-years ${selectedSemester === 0 ? 'selected' : ''}`}
        onClick={() => setSelectedSemester(0)}
      >
        <div className="div">
          <div className="text-wrapper-3">{curSemester}</div>
          <div className="text-wrapper-4">Current Semester</div>
        </div>
      </div>
      <div
        className={`element-years ${selectedSemester === 1 ? 'selected' : ''}`}
        onClick={() => setSelectedSemester(1)}
      >
        <div className="div">
          <div className="text-wrapper-3">{nextSemester}</div>
          <div className="text-wrapper-4">Next Semester</div>
        </div>
      </div>
    </div>
  );
};
