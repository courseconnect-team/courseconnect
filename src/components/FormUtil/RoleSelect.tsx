import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

export default function RoleSelect() {
  const [value, setValue] = React.useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue((event.target as HTMLInputElement).value);
  };

  return (
    <FormControl>
      <RadioGroup
        row
        aria-labelledby="role-radio-group-label"
        name="roles-radio-group"
        value={value}
        onChange={handleChange}
      >
        <FormControlLabel
          value="student_applying"
          control={<Radio />}
          label="Student"
        />
        <FormControlLabel value="faculty" control={<Radio />} label="Faculty" />
      </RadioGroup>
    </FormControl>
  );
}
