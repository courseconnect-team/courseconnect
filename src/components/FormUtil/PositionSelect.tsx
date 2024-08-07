import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';

export default function PositionSelect() {
  const [value, setValue] = React.useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue((event.target as HTMLInputElement).value);
  };

  return (
    <FormControl required>
      <RadioGroup
        name="positions-radio-group"
        value={value}
        onChange={handleChange}
        aria-required="true"
      >
        <FormControlLabel
          value="TA"
          control={<Radio />}
          label="Teaching Assistant (TA)"
        />
        <FormControlLabel
          value="UPI"
          control={<Radio />}
          label="Undergraduate Peer Instructor (UPI)"
        />
        <FormControlLabel value="Grader" control={<Radio />} label="Grader" />
      </RadioGroup>
    </FormControl>
  );
}
