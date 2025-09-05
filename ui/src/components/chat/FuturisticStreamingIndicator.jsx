/**
 * Futuristic Streaming Indicator for AI Chat Assistant
 * Clear, visible loading animation that shows AI is actively responding
 */

import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { createLogger } from '../../utils/log.js';

const logger = createLogger('FuturisticStreamingIndicator');

const MotionDiv = motion.div;

// Main container for the streaming indicator
const StreamingContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  marginLeft: theme.spacing(1.5),
  gap: theme.spacing(0.5),
  position: 'relative',
  verticalAlign: 'middle',
}));

// Individual animated dot
const AnimatedDot = styled(MotionDiv)(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  boxShadow: `0 0 8px ${theme.palette.primary.main}40`,
}));

/**
 * FuturisticStreamingIndicator component
 * @returns {React.Element} FuturisticStreamingIndicator component
 */
const FuturisticStreamingIndicator = () => {
  logger.info('FuturisticStreamingIndicator', 'Rendering futuristic streaming indicator');

  // Animation for each dot with staggered timing
  const dotAnimation = (delay) => ({
    scale: [0.5, 1.2, 0.5],
    opacity: [0.3, 1, 0.3],
    transition: {
      duration: 1.0,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    },
  });

  return (
    <StreamingContainer>
      <AnimatedDot
        animate={dotAnimation(0)}
      />
      <AnimatedDot
        animate={dotAnimation(0.2)}
      />
      <AnimatedDot
        animate={dotAnimation(0.4)}
      />
    </StreamingContainer>
  );
};

export default FuturisticStreamingIndicator;
