import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { modernInputSx } from '@/components/FormStyles';

/** Department codes offered on the TA and research application forms. */
export const TA_DEPARTMENTS = [
  'ECE',
  'CISE',
  'ESSIE',
  'MAE',
  'MSE',
  'ABE',
  'CHE',
  'ISE',
  'EED',
  'BME',
] as const;

export default function DepartmentSelect() {
  const [department, setDepartment] = React.useState('');

  const handleChange = (event: SelectChangeEvent) => {
    setDepartment(event.target.value as string);
  };

  // InputLabel props: https://mui.com/material-ui/api/input-label/#props
  // for example, "required"

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth variant="filled" sx={modernInputSx}>
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
          {TA_DEPARTMENTS.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
