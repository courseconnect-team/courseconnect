import * as React from 'react';
import CircularProgress, {
  CircularProgressProps,
} from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

interface EnrollmentInfoProps extends CircularProgressProps {
  students: number;
  capacity: number;
}

const EnrollmentInfo: React.FC<EnrollmentInfoProps> = (props) => {
  const { students, capacity, ...circularProgressProps } = props;
  const percentage = (students / capacity) * 100;

  return (
    <Box sx={{ padding: '16px', borderRadius: '12px', boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>
        Students Enrolled
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {students}
        </Typography>
        <Typography variant="body1" sx={{ ml: 1, color: 'text.secondary' }}>
          students
        </Typography>
        <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
          of {capacity} cap
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={percentage}
            size={80}
            thickness={4}
            {...circularProgressProps}
            sx={{ color: 'purple' }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              color="text.secondary"
            >
              {`${Math.round(percentage)}%`}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Students enrolled
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {students} students
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{ height: '8px', borderRadius: '4px' }}
      />
    </Box>
  );
};

export default EnrollmentInfo;
