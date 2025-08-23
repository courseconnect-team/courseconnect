'use client';

import * as React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

type EnrollmentDonutProps = {
  students: number;
  capacity: number;

  // tweakables
  size?: number;             // circle diameter
  thickness?: number;        // stroke width
  color?: string;            // progress color

  percentFontSize?: number;  // % text inside donut
  numberFontSize?: number;   // "40"
  labelFontSize?: number;    // "students"
  subFontSize?: number;      // "of 75 cap"
};

const EnrollmentDonut: React.FC<EnrollmentDonutProps> = ({
  students,
  capacity,
  // thinner but bigger defaults:
  size = 140,
  thickness = 4,
  color = '#6C37D8',

  percentFontSize = 36,
  numberFontSize = 40,
  labelFontSize = 16,
  subFontSize = 14,
}) => {
  const pct = capacity > 0 ? (students / capacity) * 100 : 0;
  const value = Math.max(0, Math.min(100, pct));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2}}>
      {/* Donut */}
      <Box sx={{ position: 'relative', width: size, height: size }}>
        {/* Track */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={thickness}
          sx={{
            color: (t) => t.palette.grey[300],
            position: 'absolute',
            inset: 0,
            '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
          }}
        />
        {/* Progress */}
        <CircularProgress
          variant="determinate"
          value={value}
          size={size}
          thickness={thickness}
          sx={{
            color,
            position: 'absolute',
            inset: 0,
            '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
          }}
        />
        {/* Center % */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: percentFontSize }}>
            {`${Math.round(value)}%`}
          </Typography>
        </Box>
      </Box>

      {/* Right text block */}
      <Box sx={{ lineHeight: 1.2 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography component="span" sx={{ fontSize: numberFontSize, fontWeight: 700 }}>
            {students}
          </Typography>
          <Typography component="span" color="text.secondary" sx={{ fontSize: labelFontSize }}>
            students
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ fontSize: subFontSize }}>
          of {capacity} cap
        </Typography>
      </Box>
    </Box>
  );
};

export default EnrollmentDonut;
