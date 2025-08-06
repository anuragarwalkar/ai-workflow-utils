import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      zIndex: 9999,
    }}
  >
    <CircularProgress size={60} sx={{ color: 'white' }} />
  </Box>
);

export default LoadingFallback;
