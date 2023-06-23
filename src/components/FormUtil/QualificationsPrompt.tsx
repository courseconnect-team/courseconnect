import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

export default function QualificationsPrompt() {
  return (
    <Box
      component="form"
      sx={{
        '& .MuiTextField-root': {
          m: 1,
          pr: 2,
          minWidth: '45ch',
          width: '100%',
        },
      }}
      noValidate
      autoComplete="off"
    >
      <div>
        <TextField
          id="qualifications-prompt"
          label="I am qualified because..."
          multiline
          rows={10}
          variant="filled"
        />
      </div>
    </Box>
  );
}
