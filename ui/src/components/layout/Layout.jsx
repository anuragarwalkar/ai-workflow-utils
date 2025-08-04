import React from 'react';
import { Container, Paper, Box } from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';
import Header from './Header';

const Layout = ({ children }) => {
  const { isDark } = useAppTheme();

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        background: isDark 
          ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDark
            ? 'radial-gradient(circle at 20% 80%, rgba(45, 55, 72, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: isDark 
            ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          zIndex: -2,
          pointerEvents: 'none',
        }
      }}
    >
      <Header />
      <Container 
        maxWidth="xl" 
        sx={{ 
          px: 1,
          py: 2,
          position: 'relative', 
          zIndex: 1
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3,
            width: '100%',
            background: isDark 
              ? 'rgba(45, 55, 72, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: isDark 
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: isDark 
              ? '0 20px 60px rgba(0, 0, 0, 0.3)'
              : '0 20px 60px rgba(0, 0, 0, 0.1)',
          }}
        >
          {children}
        </Paper>
      </Container>
    </Box>
  );
};

export default Layout;
