import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

export default function ProficiencySelect() {
  const [proficiency, setProficiency] = React.useState('');

  const handleChange = (event: SelectChangeEvent) => {
    setProficiency(event.target.value as string);
  };

  // InputLabel props: https://mui.com/material-ui/api/input-label/#props
  // for example, "required"

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel required id="proficiency-select-label">
          English Proficiency
        </InputLabel>
        <Select
          labelId="proficiency-select-label"
          id="proficiency-select"
          value={proficiency}
          name="proficiency-select"
          label="Department"
          onChange={handleChange}
        >
          <MenuItem value={'lang_yes_native'}>Yes - native language</MenuItem>
          <MenuItem value={'lang_yes_non-native'}>
            Yes - non-native language
          </MenuItem>
          <MenuItem value={'lang_no'}>No</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
