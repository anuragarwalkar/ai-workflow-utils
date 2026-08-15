import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

const progressIndeterminate = keyframes`
  0% {
    left: -40%;
    right: 100%;
  }
  60% {
    left: 100%;
    right: -30%;
  }
  100% {
    left: 100%;
    right: -30%;
  }
`;

const progressGlow = keyframes`
  0%, 100% {
    opacity: 0.8;
    filter: drop-shadow(0 0 6px rgba(102, 126, 234, 0.8));
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 0 12px rgba(78, 205, 196, 1));
  }
`;

/**
 * RouteProgressBar component
 * Displays a sleek glowing progress bar at the top of the viewport during route transitions
 */
const RouteProgressBar = ({ height = 3, zIndex = 10000 }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height,
        zIndex,
        overflow: 'hidden',
        background: 'rgba(0, 0, 0, 0.1)',
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #4ecdc4 100%)',
          borderRadius: '0 2px 2px 0',
          animation: `${progressIndeterminate} 1.4s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite, ${progressGlow} 1.4s ease-in-out infinite`,
        }}
      />
    </Box>
  );
};

export default RouteProgressBar;
