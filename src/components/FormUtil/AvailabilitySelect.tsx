import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const hours = ['7 hrs/week', '14 hrs/week', '20 hrs/week'];

export default function AvailabilitySelect() {
  const [hourOption, setHourOption] = React.useState<string[]>([]);

  const handleChange = (event: SelectChangeEvent<typeof hourOption>) => {
    const {
      target: { value },
    } = event;
    setHourOption(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };

  return (
    <div>
      <FormControl sx={{ m: 1, width: 410 }}>
        <InputLabel required id="hours-checkbox-label">
          Hour(s) Available
        </InputLabel>
        <Select
          labelId="hours-checkbox-label"
          id="hours-checkbox"
          multiple
          value={hourOption}
          onChange={handleChange}
          input={<OutlinedInput label="Hours" />}
          renderValue={(selected) => selected.join(', ')}
          MenuProps={MenuProps}
        >
          {hours.map((hour) => (
            <MenuItem key={hour} value={hour}>
              <Checkbox checked={hourOption.indexOf(hour) > -1} />
              <ListItemText primary={hour} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
