import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar } from '@mui/material';
import { 
  Home as HomeIcon, 
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon 
} from '@mui/icons-material';
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
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1) rotate(5deg)',
                boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
              },
            }}
          >
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PsychologyIcon sx={{ fontSize: 24, color: 'white' }} />
              <AutoAwesomeIcon 
                sx={{ 
                  fontSize: 12, 
                  color: '#f093fb', 
                  position: 'absolute', 
                  top: -2, 
                  right: -2,
                  animation: 'pulse 2s infinite',
                }} 
              />
            </Box>
          </Avatar>
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
