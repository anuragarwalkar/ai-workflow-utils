import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionDiv = motion.div;

const FuturisticLoader = () => {
  const pulseVariants = {
    initial: { scale: 1, opacity: 0.7 },
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const orbitalVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 255, 198, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      {/* Central Loading Animation */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Main Circle with Orbital Rings */}
        <Box
          sx={{
            position: 'relative',
            width: 120,
            height: 120,
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Main Circle */}
          <MotionBox
            animate='animate'
            initial='initial'
            sx={{
              position: 'relative',
              zIndex: 3,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 50px rgba(102, 126, 234, 0.3)',
            }}
            variants={pulseVariants}
          >
            <Typography
              sx={{
                color: 'white',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
              }}
              variant='h4'
            >
              J
            </Typography>
          </MotionBox>

          {/* First Orbital Ring */}
          <MotionDiv
            animate='animate'
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 160,
              height: 160,
              marginTop: -80, // Half of height
              marginLeft: -80, // Half of width
              border: '2px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '50%',
              borderTopColor: 'rgba(102, 126, 234, 0.8)',
              zIndex: 1,
            }}
            variants={orbitalVariants}
          />

          {/* Second Orbital Ring */}
          <MotionDiv
            animate='animate'
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 180,
              height: 180,
              marginTop: -90, // Half of height
              marginLeft: -90, // Half of width
              border: '1px solid rgba(118, 75, 162, 0.2)',
              borderRadius: '50%',
              borderBottomColor: 'rgba(118, 75, 162, 0.6)',
              zIndex: 0,
            }}
            variants={{
              animate: {
                rotate: -360,
                transition: {
                  duration: 4,
                  repeat: Infinity,
                  ease: 'linear',
                },
              },
            }}
          />
        </Box>

        {/* Loading Text */}
        <Box
          sx={{
            textAlign: 'center',
            width: '100%',
            maxWidth: 400,
            mx: 'auto',
          }}
        >
          <Typography
            sx={{
              mb: 2,
              fontWeight: 600,
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            variant='h5'
          >
            Loading Jira Issue
          </Typography>

          <Typography
            sx={{
              color: 'text.secondary',
              mb: 3,
              opacity: 0.8,
            }}
            variant='body1'
          >
            Preparing futuristic view...
          </Typography>

          <Box sx={{ width: '100%', maxWidth: 300, mx: 'auto' }}>
            <LinearProgress
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <MotionDiv
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          key={i}
          style={{
            position: 'absolute',
            width: 8 + i * 2,
            height: 8 + i * 2,
            background: `rgba(${102 + i * 20}, ${126 + i * 10}, 234, 0.6)`,
            borderRadius: '50%',
            left: `${20 + i * 10}%`,
            top: `${30 + i * 5}%`,
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </Box>
  );
};

export default FuturisticLoader;
