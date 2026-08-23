/**
 * Futuristic Chat Loading Overlay
 * Shows when the entire chat system is loading or initializing
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { createLogger } from '../../utils/log.js';

const logger = createLogger('FuturisticChatLoader');

const MotionBox = motion(Box);
const MotionDiv = motion.div;

// Main overlay container
const LoaderOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(10px)',
  zIndex: 1000,
  color: theme.palette.primary.contrastText,
}));

// Animated background
const AnimatedBackground = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: `
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 255, 198, 0.1) 0%, transparent 50%)
  `,
}));

// Main orb with neural patterns
const MainOrb = styled(MotionBox)(({ theme }) => ({
  position: 'relative',
  width: 120,
  height: 120,
  borderRadius: '50%',
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `0 0 60px rgba(102, 126, 234, 0.4)`,
  marginBottom: theme.spacing(4),
}));

// Orbital rings
const OrbitalRing = styled(MotionDiv)(() => ({
  position: 'absolute',
  border: `2px solid rgba(102, 126, 234, 0.3)`,
  borderRadius: '50%',
  borderTopColor: 'rgba(102, 126, 234, 0.8)',
}));

/**
 * FuturisticChatLoader component
 * @param {Object} props - Component props
 * @param {string} props.message - Loading message to display
 * @param {boolean} props.visible - Whether the loader is visible
 * @returns {React.Element} FuturisticChatLoader component
 */
const FuturisticChatLoader = ({ message = 'Initializing AI Assistant...', visible = true }) => {
  logger.info('FuturisticChatLoader', 'Rendering chat loader', { visible, message });

  if (!visible) return null;

  // Animation variants
  const orbVariants = {
    animate: {
      scale: [1, 1.1, 1],
      rotate: [0, 360],
      transition: {
        scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
      },
    },
  };

  const ringVariants = (duration) => ({
    animate: {
      rotate: 360,
      transition: { duration, repeat: Infinity, ease: 'linear' },
    },
  });

  const textVariants = {
    animate: {
      opacity: [0.7, 1, 0.7],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  return (
    <LoaderOverlay>
      <AnimatedBackground />
      
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Main Loading Orb */}
        <Box sx={{ position: 'relative', width: 180, height: 180 }}>
          <MainOrb animate="animate" variants={orbVariants}>
            <Typography
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '2rem',
                textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
              }}
            >
              AI
            </Typography>
          </MainOrb>

          {/* Orbital Rings */}
          <OrbitalRing
            animate="animate"
            style={{
              width: 160,
              height: 160,
              top: '50%',
              left: '50%',
              marginTop: -80,
              marginLeft: -80,
            }}
            variants={ringVariants(4)}
          />
          
          <OrbitalRing
            animate="animate"
            style={{
              width: 180,
              height: 180,
              top: '50%',
              left: '50%',
              marginTop: -90,
              marginLeft: -90,
              borderColor: 'rgba(118, 75, 162, 0.3)',
              borderBottomColor: 'rgba(118, 75, 162, 0.8)',
            }}
            variants={ringVariants(-6)}
          />

          {/* Data Particles */}
          {Array.from({ length: 6 }, (_, i) => (
            <MotionDiv
              animate={{
                y: [0, -60, 0],
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0],
              }}
              key={`particle-${i + 1}`}
              style={{
                position: 'absolute',
                width: 4,
                height: 4,
                background: 'rgba(102, 126, 234, 0.9)',
                borderRadius: '50%',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-80px)`,
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut',
              }}
            />
          ))}
        </Box>

        {/* Loading Text */}
        <MotionBox 
          animate="animate" 
          sx={{ textAlign: 'center', mt: 4 }}
          variants={textVariants}
        >
          <Typography
            sx={{
              mb: 2,
              fontWeight: 600,
              fontSize: '1.5rem',
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {message}
          </Typography>

          <Typography
            sx={{ color: 'rgba(255, 255, 255, 0.8)', opacity: 0.8 }}
            variant="body1"
          >
            Preparing neural pathways...
          </Typography>
        </MotionBox>

        {/* Progress indicators */}
        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <MotionDiv
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              key={`progress-${i + 1}`}
              style={{
                width: 8,
                height: 8,
                background: 'rgba(102, 126, 234, 0.7)',
                borderRadius: '50%',
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </Box>
      </Box>
    </LoaderOverlay>
  );
};

export default FuturisticChatLoader;
