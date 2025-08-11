import React from 'react';
import { Box, CircularProgress, TextField, Typography } from '@mui/material';

// Title Editor Component
const TitleEditor = ({ title, onChange }) => (
  <Box>
    <Typography gutterBottom variant='subtitle1'>
      Title
    </Typography>
    <TextField
      fullWidth
      multiline
      InputProps={{
        endAdornment: !title && <CircularProgress size={16} sx={{ mr: 1 }} />,
      }}
      placeholder={!title ? 'Generating title...' : ''}
      size='small'
      sx={{ mb: 2 }}
      value={title}
      variant='outlined'
      onChange={e => onChange(e.target.value)}
    />
  </Box>
);

export default TitleEditor;
