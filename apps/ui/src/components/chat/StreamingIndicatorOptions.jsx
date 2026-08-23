/**
 * Alternative Streaming Indicators
 * Different styles to choose from for the chat streaming indicator
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;
const MotionSpan = motion.span;

// Option 1: Elegant Typing Cursor
const TypingCursor = styled(MotionSpan)(({ theme }) => ({
  display: 'inline-block',
  width: 2,
  height: '1em',
  backgroundColor: theme.palette.primary.main,
  marginLeft: theme.spacing(0.5),
  borderRadius: 1,
}));

export const TypingCursorIndicator = () => (
  <TypingCursor
    animate={{
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// Option 2: Pulsing Orb
const PulsingOrb = styled(MotionDiv)(({ theme }) => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  marginLeft: theme.spacing(1),
  filter: 'drop-shadow(0 0 4px rgba(102, 126, 234, 0.6))',
}));

export const PulsingOrbIndicator = () => (
  <PulsingOrb
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.6, 1, 0.6],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// Option 3: Wave Animation
const WaveContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  marginLeft: theme.spacing(1),
  gap: 1,
}));

const WaveDot = styled(MotionDiv)(({ theme }) => ({
  width: 3,
  height: 3,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
}));

export const WaveIndicator = () => (
  <WaveContainer>
    {[0, 1, 2, 3, 4].map((i) => (
      <WaveDot
        animate={{
          y: [0, -6, 0],
          opacity: [0.4, 1, 0.4],
        }}
        key={i}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: i * 0.1,
          ease: 'easeInOut',
        }}
      />
    ))}
  </WaveContainer>
);

// Option 4: Minimal Text
const TypingText = styled(Typography)(({ theme }) => ({
  display: 'inline',
  fontSize: '0.75em',
  color: theme.palette.text.secondary,
  marginLeft: theme.spacing(1),
  fontStyle: 'italic',
}));

export const MinimalTextIndicator = () => (
  <TypingText
    animate={{
      opacity: [0.5, 1, 0.5],
    }}
    component={MotionSpan}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    typing...
  </TypingText>
);

// Option 5: Breathing Dot (ChatGPT style)
const BreathingDot = styled(MotionDiv)(({ theme }) => ({
  display: 'inline-block',
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  marginLeft: theme.spacing(1),
  filter: 'drop-shadow(0 0 2px rgba(102, 126, 234, 0.4))',
}));

export const BreathingDotIndicator = () => (
  <BreathingDot
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);
