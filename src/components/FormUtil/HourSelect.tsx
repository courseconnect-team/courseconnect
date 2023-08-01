import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

export default function HourSelect() {
  const [value, setValue] = React.useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue((event.target as HTMLInputElement).value);
  };

  return (
    <FormControl>
      <FormLabel required id="hours-radio-group-label">
        Hours
      </FormLabel>
      <RadioGroup
        row
        aria-labelledby="hours-radio-group-label"
        name="hours-radio-group"
        value={value}
        onChange={handleChange}
      >
        <FormControlLabel value="7" control={<Radio />} label="7" />
        <FormControlLabel value="14" control={<Radio />} label="14" />
        <FormControlLabel value="20" control={<Radio />} label="20" />
      </RadioGroup>
      <FormHelperText id="hours-radio-group-helper-text" sx={{ ml: '0' }}>
        Please select the number of hours per week they will work.
      </FormHelperText>
    </FormControl>
  );
}
