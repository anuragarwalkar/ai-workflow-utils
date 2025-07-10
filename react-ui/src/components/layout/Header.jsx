import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
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
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Box
          onClick={handleLogoClick}
          sx={{
            cursor: 'pointer',
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h1" component="h1" sx={{ color: 'white' }}>
            AI Workflow Utils
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
