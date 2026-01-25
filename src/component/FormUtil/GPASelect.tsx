import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Select, { SelectChangeEvent } from '@mui/material/Select';

export default function GPA_Select() {
  const [gpa, setGPA] = React.useState('');

  const handleChange = (event: SelectChangeEvent) => {
    setGPA(event.target.value as string);
  };

  // InputLabel props: https://mui.com/material-ui/api/input-label/#props
  // for example, "required"

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel required id="gpa-select-label">
          GPA
        </InputLabel>
        <Select
          labelId="gpa-select-label"
          id="gpa-select"
          variant="filled"
          value={gpa}
          name="gpa-select"
          label="GPA"
          onChange={handleChange}
        >
          <MenuItem value={'4.0'}>4.0</MenuItem>
          <MenuItem value={'>=3.5'}>≥ 3.5</MenuItem>
          <MenuItem value={'>=3.0'}>≥ 3.0</MenuItem>
          <MenuItem value={'>=2.5'}>≥ 2.5</MenuItem>
          <MenuItem value={'>=2.0'}>≥ 2.0</MenuItem>
          <MenuItem value={'<2.0'}>&lt; 2.0</MenuItem>
        </Select>
        <FormHelperText id="gpa-select-helper-text">
          Select your GPA on a 4.0 scale. Please visit{' '}
          <a href="https://one.uf.edu/" target="_blank">
            ONE.UF
          </a>{' '}
          to confirm.
        </FormHelperText>
      </FormControl>
    </Box>
  );
}
