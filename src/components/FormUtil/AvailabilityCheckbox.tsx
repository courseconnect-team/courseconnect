import * as React from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

interface CheckboxProps {
  name: string;
}

export default function AvailabilityCheckbox({ name }: CheckboxProps) {
  const [state, setState] = React.useState({
    seven: false,
    fourteen: false,
    twenty: false,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Extract the original name from the event target name by removing the prefix
    const originalName = event.target.name.replace(`${name}_`, '');

    setState({
      ...state,
      [originalName]: event.target.checked,
    });
  };

  const { seven, fourteen, twenty } = state;
  const error = [seven, fourteen, twenty].filter((v) => v).length !== 2;

  return (
    <Box sx={{ display: 'flex' }}>
      <FormControl component="fieldset" variant="standard">
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={seven}
                onChange={handleChange}
                name={`${name}_seven`}
              />
            }
            label="7 hrs/week"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={fourteen}
                onChange={handleChange}
                name={`${name}_fourteen`}
              />
            }
            label="14 hrs/week"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={twenty}
                onChange={handleChange}
                name={`${name}_twenty`}
              />
            }
            label="20 hrs/week"
          />
        </FormGroup>
      </FormControl>
    </Box>
  );
}
