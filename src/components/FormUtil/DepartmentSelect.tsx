import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

export default function DepartmentSelect() {
  const [department, setDepartment] = React.useState('');

  const handleChange = (event: SelectChangeEvent) => {
    setDepartment(event.target.value as string);
  };

  // InputLabel props: https://mui.com/material-ui/api/input-label/#props
  // for example, "required"

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel required id="department-select-label">
          Department
        </InputLabel>
        <Select
          labelId="department-select-label"
          id="department-select"
          variant="filled"
          value={department}
          name="department-select"
          label="Department"
          onChange={handleChange}
        >
          <MenuItem value={'ECE'}>ECE</MenuItem>
          <MenuItem value={'CISE'}>CISE</MenuItem>
          <MenuItem value={'ESSIE'}>ESSIE</MenuItem>
          <MenuItem value={'MAE'}>MAE</MenuItem>
          <MenuItem value={'MSE'}>MSE</MenuItem>
          <MenuItem value={'ABE'}>ABE</MenuItem>
          <MenuItem value={'CHE'}>CHE</MenuItem>
          <MenuItem value={'ISE'}>ISE</MenuItem>
          <MenuItem value={'EED'}>EED</MenuItem>
          <MenuItem value={'BME'}>BME</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
