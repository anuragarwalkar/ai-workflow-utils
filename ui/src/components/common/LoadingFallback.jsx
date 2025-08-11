import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';

const LoadingFallback = () => {
  const { isDark } = useAppTheme();

  return (
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
        background: isDark
          ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: 9999,
      }}
    >
      <CircularProgress
        size={60}
        sx={{
          color: isDark ? '#4ecdc4' : 'white',
        }}
      />
    </Box>
  );
};

export default LoadingFallback;
