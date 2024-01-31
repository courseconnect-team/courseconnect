import * as React from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

interface CheckboxProps {
  name: string;
}

export default function SemesterCheckbox({ name }: CheckboxProps) {
  const [state, setState] = React.useState({
    fall_2023: false,
    spring_2024: false,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Extract the original name from the event target name by removing the prefix
    const originalName = event.target.name.replace(`${name}_`, '');

    setState({
      ...state,
      [originalName]: event.target.checked,
    });
  };

  const { fall_2023, spring_2024 } = state;
  const error = [fall_2023, spring_2024].filter((v) => v).length !== 2;

  return (
    <Box sx={{ display: 'flex' }}>
      <FormControl component="fieldset" variant="standard">
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={fall_2023}
                onChange={handleChange}
                name={`${name}_fall_2023`}
              />
            }
            label="Fall 2023"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={spring_2024}
                onChange={handleChange}
                name={`${name}_spring_2024`}
              />
            }
            label="Spring 2024"
          />
        </FormGroup>
      </FormControl>
    </Box>
  );
}
