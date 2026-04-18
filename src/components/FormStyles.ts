import type { SxProps, Theme } from '@mui/material/styles';

export const modernInputSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: '#fafafa',
    '& fieldset': { borderColor: '#e3e3e3' },
    '&:hover fieldset': { borderColor: '#bbb' },
    '&.Mui-focused fieldset': { borderColor: '#6739B7', borderWidth: 2 },
  },
  '& .MuiFilledInput-root': {
    borderRadius: 2.5,
    bgcolor: '#fafafa',
    '&:hover': { bgcolor: '#f3f3f3' },
    '&.Mui-focused': { bgcolor: '#f3f3f3' },
    '&:before, &:after': { display: 'none' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#6739B7' },
};
