import React from 'react';
import { Box, InputBase, SxProps, Theme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
interface SearchBoxProps {
  placeholder?: string;
  sx?: SxProps<Theme>;
  researchListingsFunc: () => Promise<void>;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = 'Hinted search text',
  sx,
  researchListingsFunc,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f2ecf9',
        borderRadius: '9999px', // pill shape
        padding: '0 1rem',
        // Optional styling to match your design:
        height: 48,
        color: '#443F4D', // text/icon color
        ...sx,
      }}
    >
      <MenuIcon sx={{ mr: 1 }} />
      <InputBase
        placeholder={placeholder}
        sx={{
          flex: 1,
          ml: 1,
          // remove default input styles
          '& .MuiInputBase-input': {
            padding: 0,
          },
        }}
      />
      <SearchIcon sx={{ ml: 1 }} onClick={() => researchListingsFunc()} />
    </Box>
  );
};

export default SearchBox;
