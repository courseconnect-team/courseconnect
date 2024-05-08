// CourseNavBar.js
import React, { useState } from 'react';
import './style.css';

const CourseNavBar = (props) => {
  const [selectedItem, setSelectedItem] = useState('Review');

  const handleClick = (item) => {
    setSelectedItem(item);
    props.handleClick(item)
  };

  return (
    <div className="courseNavBar">

      <div
        className={`courseNavBarItem ${selectedItem === 'Review' ? 'selected' : ''
          }`}
        onClick={() => handleClick('Review')}
      >
        <div
          className="oval-button needsReview"
          style={{ color: selectedItem === 'Review' ? 'white' : '#000' }}
        >
          Needs Review
        </div>
      </div>
      <div
        className={`courseNavBarItem ${selectedItem === 'Approved' ? 'selected' : ''
          }`}
        onClick={() => handleClick('Approved')}
      >
        <div
          className="oval-button approved"
          style={{ color: selectedItem === 'Approved' ? 'white' : '#000' }}
        >
          Approved
        </div>
      </div>
      <div
        className={`courseNavBarItem ${selectedItem === 'Denied' ? 'selected' : ''
          }`}
        onClick={() => handleClick('Denied')}
      >
        <div
          className="oval-button denied"
          style={{ color: selectedItem === 'Denied' ? 'white' : '#000' }}
        >
          Denied
        </div>
      </div>
      <div
        className={`courseNavBarItem ${selectedItem === 'Assigned' ? 'selected' : ''
          }`}
        onClick={() => handleClick('Assigned')}
      >
        <div
          className="oval-button assigned"
          style={{ color: selectedItem === 'Assigned' ? 'white' : '#000' }}
        >
          Assigned
        </div>
      </div>
    </div>

  );
};

export default CourseNavBar;
