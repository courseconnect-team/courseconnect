import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

export default function SemesterStatusSelect() {
  const [value, setValue] = React.useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue((event.target as HTMLInputElement).value);
  };

  return (
    <FormControl>
      <FormLabel required id="semstatus-radio-group-label">
        Upcoming Semester Status
      </FormLabel>
      <RadioGroup
        row
        aria-labelledby="semstatus-radio-group-label"
        name="semstatus-radio-group"
        value={value}
        onChange={handleChange}
      >
        <FormControlLabel
          value="undergraduate"
          control={<Radio />}
          label="Undergraduate"
        />
        <FormControlLabel
          value="graduate"
          control={<Radio />}
          label="Graduate"
        />
      </RadioGroup>
    </FormControl>
  );
}
