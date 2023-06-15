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
          value={department}
          label="Department"
          onChange={handleChange}
        >
          <MenuItem value={10}>ECE</MenuItem>
          <MenuItem value={20}>CISE</MenuItem>
          <MenuItem value={30}>ESSIE</MenuItem>
          <MenuItem value={40}>MAE</MenuItem>
          <MenuItem value={50}>MSE</MenuItem>
          <MenuItem value={60}>ABE</MenuItem>
          <MenuItem value={70}>CHE</MenuItem>
          <MenuItem value={80}>ISE</MenuItem>
          <MenuItem value={90}>EED</MenuItem>
          <MenuItem value={100}>BME</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
