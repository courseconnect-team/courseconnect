import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

export default function DegreeSelect() {
  const [value, setValue] = React.useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue((event.target as HTMLInputElement).value);
  };

  return (
    <FormControl>
      <FormLabel required id="degree-radio-group-label">
        Degree
      </FormLabel>
      <RadioGroup
        row
        aria-labelledby="degree-radio-group-label"
        name="degrees-radio-group"
        value={value}
        onChange={handleChange}
      >
        <FormControlLabel value="BS" control={<Radio />} label="BS" />
        <FormControlLabel value="MS" control={<Radio />} label="MS" />
        <FormControlLabel value="PhD" control={<Radio />} label="PhD" />
      </RadioGroup>
    </FormControl>
  );
}
