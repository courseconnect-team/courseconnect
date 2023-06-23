import * as React from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

export default function CheckboxLabels() {
  return (
    <FormGroup id="availability-semesters-checkbox">
      <FormControlLabel
        value="summerb_2023"
        control={<Checkbox />}
        label="Summer B 2023"
      />
      <FormControlLabel
        value="fall_2023"
        control={<Checkbox />}
        label="Fall 2023"
      />
      <FormControlLabel
        value="spring_2024"
        control={<Checkbox />}
        label="Spring 2024"
      />
    </FormGroup>
  );
}
