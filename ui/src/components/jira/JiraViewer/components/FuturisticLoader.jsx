import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
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
        ease: "easeInOut"
      }
    }
  };

  const orbitalVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      }
    }
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
        overflow: 'hidden'
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
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <MotionBox
          variants={pulseVariants}
          initial="initial"
          animate="animate"
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4,
              boxShadow: '0 0 50px rgba(102, 126, 234, 0.3)',
            }}
          >
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'white', 
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
              }}
            >
              J
            </Typography>
          </Box>
        </MotionBox>

        {/* Orbital Rings */}
        <MotionDiv
          variants={orbitalVariants}
          animate="animate"
          style={{
            position: 'absolute',
            top: -20,
            left: -20,
            width: 160,
            height: 160,
            border: '2px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '50%',
            borderTopColor: 'rgba(102, 126, 234, 0.8)',
            zIndex: 0
          }}
        />

        <MotionDiv
          variants={{
            animate: {
              rotate: -360,
              transition: {
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }
            }
          }}
          animate="animate"
          style={{
            position: 'absolute',
            top: -30,
            left: -30,
            width: 180,
            height: 180,
            border: '1px solid rgba(118, 75, 162, 0.2)',
            borderRadius: '50%',
            borderBottomColor: 'rgba(118, 75, 162, 0.6)',
            zIndex: 0
          }}
        />

        {/* Loading Text */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Loading Jira Issue
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              mb: 3,
              opacity: 0.8
            }}
          >
            Preparing futuristic view...
          </Typography>

          <Box sx={{ width: 300, mx: 'auto' }}>
            <LinearProgress 
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  borderRadius: 2,
                }
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Floating Particles */}
      />

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <MotionDiv
          key={i}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            width: 8 + i * 2,
            height: 8 + i * 2,
            background: `rgba(${102 + i * 20}, ${126 + i * 10}, 234, 0.6)`,
            borderRadius: '50%',
            left: `${20 + i * 10}%`,
            top: `${30 + i * 5}%`,
          }}
        />
      ))}
    </Box>
  );
};

export default FuturisticLoader;
