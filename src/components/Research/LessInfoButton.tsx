import React from 'react';
import Button from '@mui/material/Button';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface LessInfoButtonProps {
  onClick: () => void;
}

const LessInfoButton: React.FC<LessInfoButtonProps> = ({ onClick }) => {
  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<KeyboardArrowUpIcon fontSize="small" />}
      sx={{
        textTransform: 'none',  // Prevent uppercase text
        borderColor: '#ddd',    // Lighter border color
        borderRadius: '8px',    // Rounded corners
        color: '#000',          // Text/icon color
      }}
      onClick={onClick}
    >
      Less Info
    </Button>
  );
};

export default LessInfoButton;
