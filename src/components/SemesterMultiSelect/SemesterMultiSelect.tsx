// components/SemesterMultiSelect.tsx
import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import type { SemesterName } from '@/hooks/useSemesterOptions';
import { generateSemesters } from '@/hooks/useSemesterOptions';
const ITEM_HEIGHT = 40;
const ITEM_PADDING_TOP = 8;

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 280,
      border: '1px solid #000000',
      borderRadius: 20,
    },
  },
};

export interface SemesterMultiSelectProps {
  value: SemesterName[]; // controlled value (multi)
  onChange: (val: SemesterName[]) => void; // setter from parent
  names?: SemesterName[]; // optional: pass your own options
  startYear?: number; // default 2023
  width?: number | string; // default 600
  placeholder?: string; // default "Select Semesters"
}

/** Generate semesters from startYear → current year (Spring/Summer/Fall). */

const SemesterMultiSelect: React.FC<SemesterMultiSelectProps> = ({
  value,
  onChange,
  names,
  startYear = 2023,
  width = 600,
}) => {
  const options = names ?? generateSemesters(startYear);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const next =
      typeof event.target.value === 'string'
        ? (event.target.value.split(',') as SemesterName[])
        : (event.target.value as SemesterName[]);
    onChange(next);
  };

  const removeOne = (sem: SemesterName) =>
    onChange(value.filter((v) => v !== sem));

  return (
    <FormControl sx={{ width }}>
      <Select<string[]>
        multiple
        value={value}
        onChange={handleChange}
        MenuProps={MenuProps}
        displayEmpty
        inputProps={{ 'aria-label': 'Semester select (multi)' }}
        sx={{
          borderRadius: '8px',
          minHeight: 45,
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            py: 0.5,
          },
        }}
        renderValue={(selected) => {
          const sel = selected as SemesterName[];
          if (!sel?.length) {
            return (
              <em className="text-button">
                <span
                  style={{
                    fontWeight: '600',
                    backgroundColor: '#d9d9d9',
                    padding: '8px',
                    borderRadius: '5px',
                  }}
                >
                  Semesters
                </span>
              </em>
            );
          }
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {sel.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  onMouseDown={(e) => e.stopPropagation()}
                  onDelete={() => removeOne(s)}
                  size="small"
                  sx={{ borderRadius: 1.5 }}
                />
              ))}
            </Box>
          );
        }}
      >
        {options.map((name) => (
          <MenuItem
            key={name}
            value={name}
            sx={{
              borderRadius: '14px',
              mx: '10px',
              my: '2px',
              fontWeight: value.includes(name) ? 'bold' : 'normal',
              '&:hover': { fontWeight: 'bold' },
              minHeight: 36,
              py: '4px',
            }}
          >
            <em style={{ letterSpacing: '-0.3px' }}>{name}</em>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SemesterMultiSelect;
