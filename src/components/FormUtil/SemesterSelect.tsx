import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import scss from './SemesterSelect.module.scss';

const semesters = ['Summer B 2023', 'Fall 2023', 'Spring 2024'];

export default function SemesterSelect() {
  const [semesterName, setSemesterName] = React.useState<string[]>([]);

  const handleChange = (event: SelectChangeEvent<typeof semesterName>) => {
    const {
      target: { value },
    } = event;
    setSemesterName(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };

  return (
    <div>
      <FormControl className={scss.semesterForm} sx={{ m: 1 }}>
        <InputLabel required id="semester-checkbox-label">
          Semester(s) Available
        </InputLabel>
        <Select
          labelId="semester-checkbox-label"
          id="semester-checkbox"
          multiple
          value={semesterName}
          onChange={handleChange}
          input={<OutlinedInput label="Semester" />}
          renderValue={(selected) => selected.join(', ')}
        >
          {semesters.map((semester) => (
            <MenuItem key={semester} value={semester}>
              <Checkbox checked={semesterName.indexOf(semester) > -1} />
              <ListItemText primary={semester} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
