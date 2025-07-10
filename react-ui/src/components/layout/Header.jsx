import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setCurrentView } from '../../store/slices/appSlice';
import { resetCreateJira, resetViewJira } from '../../store/slices/jiraSlice';
import { closeViewJiraModal } from '../../store/slices/uiSlice';

const Header = () => {
  const dispatch = useDispatch();

  const handleLogoClick = () => {
    // Reset all state and go back to home
    dispatch(setCurrentView('home'));
    dispatch(resetCreateJira());
    dispatch(resetViewJira());
    dispatch(closeViewJiraModal());
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <Toolbar sx={{ minHeight: '80px' }}>
        <Box
          onClick={handleLogoClick}
          sx={{
            cursor: 'pointer',
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <IconButton
            sx={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <HomeIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              color: 'white',
              fontWeight: 700,
              letterSpacing: '1px',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            AI Workflow Utils
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
