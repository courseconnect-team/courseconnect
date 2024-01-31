import { Box } from '@mui/material';
export default function UnderDevelopment() {
  // create a centered, medium box with a small grey border outline with centered text
  // and a message that the component is under development

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: 1,
          borderColor: 'grey.500',
          borderRadius: 1,
          width: '50%',
          height: '50%',
          margin: 'auto',
        }}
      >
        <p style={{ textAlign: 'center' }}>
          🚧 This page or component is under development. 🚧
        </p>
      </Box>
    </>
  );
}
