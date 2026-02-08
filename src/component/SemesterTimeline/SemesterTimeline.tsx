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
      {semesters.map((semester, index) => (
        <div
          key={index}
          className={`element-years ${
            selectedSemester === index ? 'selected' : ''
          }`}
          onClick={() => setSelectedSemester(index)}
        >
          <div className="div">
            <div className="text-wrapper-3">{semester}</div>
            <div className="text-wrapper-4">
              {index === 0 ? 'Current Semester' : 'Upcoming Semester'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
