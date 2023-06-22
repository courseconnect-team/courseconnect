import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

export default function PositionSelect() {
  const [value, setValue] = React.useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue((event.target as HTMLInputElement).value);
  };

  return (
    <FormControl>
      <FormLabel required id="position-radio-group-label">
        Position
      </FormLabel>
      <RadioGroup
        row
        aria-labelledby="position-radio-group-label"
        name="positions-radio-group"
        value={value}
        onChange={handleChange}
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
        <FormControlLabel value="grader" control={<Radio />} label="Grader" />
      </RadioGroup>
    </FormControl>
  );
}
