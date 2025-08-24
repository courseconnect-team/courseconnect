import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
      borderColor: '#000000', // Add border color
      border: '1px solid #000000',
      borderRadius: '20px',
    },
  },
};

interface PageProps {
  semester: string;
  setSemester: (value: string) => void;
  names: string[];
}

const SemesterSelect: React.FunctionComponent<PageProps> = ({
  semester,
  setSemester,
  names,
}) => {
  const [personName, setPersonName] = React.useState<string>('');
  const handleChange = (event: SelectChangeEvent<string>) => {
    setPersonName(event.target.value as string);
  };

  return (
    <div>
      <FormControl sx={{ m: 1, width: 336 }}>
        <Select
          displayEmpty
          value={personName}
          onChange={handleChange}
          style={{ borderRadius: '20px', borderColor: '#000000' }}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#000000', // Change border color to black
            },
            '& .MuiSelect-select': {
              color: '#000', // Ensure text color remains black always
            },
          }}
          renderValue={(selected) => {
            if (selected === '') {
              return (
                <em style={{ fontFamily: 'SF Pro Display' }}>
                  Semester:{' '}
                  <span
                    style={{ fontWeight: 'bold', letterSpacing: '-0.75px' }}
                  >
                    {semester}
                  </span>
                </em>
              );
            }
            setSemester(selected);
            return (
              <em style={{ fontFamily: 'SF Pro Display' }}>
                Semester:{' '}
                <span style={{ fontWeight: 'bold', letterSpacing: '-0.75px' }}>
                  {' '}
                  {semester}
                </span>
              </em>
            );
          }}
          MenuProps={MenuProps}
          inputProps={{ 'aria-label': 'Without label' }}
        >
          {names.map((name) => (
            <MenuItem
              key={name}
              value={name}
              sx={{
                '&:hover': {
                  fontWeight: 'bold', // Make text bold on hover
                },
                fontWeight: name === personName ? 'bold' : 'normal',
                borderRadius: '20px',
                marginLeft: '11px',
                marginRight: '11px',
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
    </div>
  );
};

export default SemesterSelect;
