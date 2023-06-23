import * as React from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

export default function CheckboxLabels() {
  return (
    <FormGroup id="availability-hours-checkbox">
      <FormControlLabel
        value="7hrs"
        control={<Checkbox />}
        label="7 hours per week"
      />
      <FormControlLabel
        value="14hrs"
        control={<Checkbox />}
        label="14 hours per week"
      />
      <FormControlLabel
        value="20hrs"
        control={<Checkbox />}
        label="20 hours per week"
      />
    </FormGroup>
  );
}
