import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

export interface AdditionalSemesterPromptProps {
  semester: string;
  onValueChange: (value: string) => void;
}

export default function AdditionalSemesterPrompt({
  semester,
  onValueChange,
}: AdditionalSemesterPromptProps) {
  const [value, setValue] = React.useState('');
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue((event.target as HTMLInputElement).value);
  };

  React.useEffect(() => {
    onValueChange(value); // call the passed in prop function
  }, [value, onValueChange]);

  if (semester === 'Undergraduate') {
    return (
      <FormControl>
        <FormLabel required id="additional-status-prompt-label">
          Graduate School Plans
        </FormLabel>
        <RadioGroup
          row
          aria-labelledby="additional-status-prompt-label"
          name="additional-status-prompt"
          value={value}
          onChange={handleChange}
        >
          <FormControlLabel
            value="noToGrad_UF"
            control={<Radio />}
            label="I do not plan on going to graduate school."
          />
          <FormControlLabel
            value="yesToGrad_UF"
            control={<Radio />}
            label="Yes; I plan on immediately continuing to graduate school at UF."
          />
          <FormControlLabel
            value="yesToGrad_notUF"
            control={<Radio />}
            label="Yes; I plan on immediately continuing to graduate school, but not at UF."
          />
        </RadioGroup>
      </FormControl>
    );
  } else if (semester === 'Graduate') {
    return (
      <FormControl>
        <FormLabel required id="additional-status-prompt-label">
          Fee Waiver Status
        </FormLabel>
        <RadioGroup
          row
          aria-labelledby="additional-status-prompt-label"
          name="additional-status-prompt"
          value={value}
          onChange={handleChange}
        >
          <FormControlLabel
            value="yes-fee-waiver"
            control={<Radio />}
            label="Yes, I will need a fee waiver in order to be a peer instructor."
          />
          <FormControlLabel
            value="no-fee-waiver"
            control={<Radio />}
            label="No, I will not need a fee waiver in order to be a peer instructor."
          />
        </RadioGroup>
      </FormControl>
    );
  }
  return <></>;
}
