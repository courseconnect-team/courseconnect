import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import type { SemesterName } from '@/hooks/useSemesterOptions';

const ITEM_HEIGHT = 40;
const ITEM_PADDING_TOP = 8;

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.0 + ITEM_PADDING_TOP,
      width: 250,
      border: '1px solid #000000',
      borderRadius: 20,
    },
  },
};

interface SemesterSelectProps {
  semester?: SemesterName; // controlled value
  onChange: React.Dispatch<React.SetStateAction<SemesterName | undefined>>; // setter from parent
  names: SemesterName[]; // options
}

const SemesterSelect: React.FC<SemesterSelectProps> = ({
  semester,
  onChange,
  names,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as SemesterName);
  };

  return (
    <FormControl sx={{ width: 275 }}>
      <Select
        value={semester ?? ''} // MUI wants string, so use empty string when undefined
        onChange={handleChange}
        MenuProps={MenuProps}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) {
            return (
              <em className="text-button">
                <span
                  style={{
                    fontWeight: '600',
                    backgroundColor: '#d9d9d9',
                    padding: '8px',
                    borderRadius: '5px',
                  }}
                >
                  Semesters
                </span>
              </em>
            );
          }
          return (
            <em className="text-button">
              <span
                style={{
                  fontWeight: '600',
                  backgroundColor: '#d9d9d9',
                  padding: '8px',
                  borderRadius: '5px',
                }}
              >
                Semesters
              </span>
              <span style={{ marginLeft: '10px', letterSpacing: '-0.75px' }}>
                {selected}
              </span>
            </em>
          );
        }}
      >
        {names.map((name) => (
          <MenuItem
            key={name}
            value={name}
            sx={{
              borderRadius: '20px',

              mx: '11px',
              fontWeight: name === semester ? 'bold' : 'normal',
              '&:hover': { fontWeight: 'bold' },
            }}
          >
            <em
              style={{
                fontFamily: 'SF Pro Display',
                letterSpacing: '-0.75px',
              }}
            >
              {name}
            </em>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SemesterSelect;
