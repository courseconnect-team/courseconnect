import React from 'react';
import Button from '@mui/material/Button';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface MoreInfoButtonProps {
  onClick: () => void; // Function signature for the click handler
}

const MoreInfoButton: React.FC<MoreInfoButtonProps> = ({ onClick }) => {
  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<KeyboardArrowDownIcon fontSize="small" />}
      sx={{
        textTransform: 'none',  // Keep text as "More Info" instead of uppercase
        borderColor: '#ddd',    // Lighter border color
        borderRadius: '8px',    // Adjust corner radius
        color: '#000',          // Text/icon color
      }}
      onClick={onClick}         // Pass the onClick prop to the Button
    >
      More Info
    </Button>
  );
};

export default MoreInfoButton;
