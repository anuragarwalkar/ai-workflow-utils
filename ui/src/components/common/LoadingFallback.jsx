import React from 'react';
import { Box, Typography } from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon, Psychology as PsychologyIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAppTheme } from '../../theme/useAppTheme';
import RouteProgressBar from './RouteProgressBar';

const MotionBox = motion(Box);
const MotionDiv = motion.div;

/**
 * Premium full-screen loading fallback with AI futuristic animations
 */
const LoadingFallback = ({ message = 'Initializing AI Workspace...' }) => {
  const { isDark } = useAppTheme();

  const orbVariants = {
    animate: {
      scale: [1, 1.08, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const ringVariants = (duration) => ({
    animate: {
      rotate: 360,
      transition: {
        duration,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        background: isDark
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: 9999,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDark
            ? 'radial-gradient(circle at 30% 70%, rgba(78, 205, 196, 0.15) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(102, 126, 234, 0.2) 0%, transparent 60%)'
            : 'radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.2) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(120, 119, 198, 0.3) 0%, transparent 60%)',
          pointerEvents: 'none',
        },
      }}
    >
      {/* Top glowing progress bar */}
      <RouteProgressBar />

      {/* Main Center Animation */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 1,
        }}
      >
        {/* Glowing Orb with Rings */}
        <Box
          sx={{
            position: 'relative',
            width: 140,
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          {/* Outer Orbital Ring 2 (140px) */}
          <MotionDiv
            animate="animate"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 140,
              height: 140,
              borderRadius: '50%',
              border: '1.5px solid transparent',
              borderTopColor: 'rgba(240, 147, 251, 0.8)',
              borderBottomColor: 'rgba(102, 126, 234, 0.8)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
            variants={ringVariants(-7)}
          />

          {/* Outer Orbital Ring 1 (120px) */}
          <MotionDiv
            animate="animate"
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '2px dashed rgba(78, 205, 196, 0.6)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
            variants={ringVariants(5)}
          />

          {/* Central Glowing Orb (90px) */}
          <MotionBox
            animate="animate"
            sx={{
              position: 'relative',
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4ecdc4 100%)',
              boxShadow: isDark
                ? '0 0 50px rgba(78, 205, 196, 0.5), 0 0 100px rgba(102, 126, 234, 0.3)'
                : '0 0 50px rgba(255, 255, 255, 0.6), 0 0 100px rgba(102, 126, 234, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              zIndex: 2,
            }}
            variants={orbVariants}
          >
            <PsychologyIcon sx={{ fontSize: 44, color: 'white' }} />
            <AutoAwesomeIcon
              sx={{
                fontSize: 18,
                color: '#f093fb',
                position: 'absolute',
                top: 14,
                right: 14,
              }}
            />
          </MotionBox>
        </Box>

        {/* Brand & Loading Status */}
        <Typography
          sx={{
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: 'white',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            mb: 0.5,
          }}
          variant="h6"
        >
          AI Workflow Utils
        </Typography>

        <Typography
          sx={{
            color: isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.9)',
            fontWeight: 500,
            letterSpacing: '0.2px',
            mb: 2.5,
          }}
          variant="body2"
        >
          {message}
        </Typography>

        {/* Pulsing Dots */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[0, 1, 2].map((i) => (
            <MotionDiv
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
              }}
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#4ecdc4',
                boxShadow: '0 0 10px #4ecdc4',
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default LoadingFallback;
