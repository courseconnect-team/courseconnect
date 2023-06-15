import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

export default function RoleSelect() {
  return (
    <FormControl>
      <FormLabel required id="roles-radio-group-label">
        Gender
      </FormLabel>
      <RadioGroup
        row
        aria-labelledby="roles-radio-group-label"
        defaultValue="Student"
        name="roles-radio-group"
      >
        <FormControlLabel value="Student" control={<Radio />} label="Student" />
        <FormControlLabel value="Faculty" control={<Radio />} label="Faculty" />
        <FormControlLabel
          value="Administrator"
          control={<Radio />}
          label="Administrator"
        />
      </RadioGroup>
    </FormControl>
  );
}
