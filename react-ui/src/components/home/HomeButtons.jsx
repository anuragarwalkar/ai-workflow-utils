import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setCurrentView } from '../../store/slices/appSlice';
import { openViewJiraModal } from '../../store/slices/uiSlice';

const HomeButtons = () => {
  const dispatch = useDispatch();

  const handleCreateJira = () => {
    dispatch(setCurrentView('createJira'));
  };

  const handleViewJira = () => {
    dispatch(openViewJiraModal());
  };

  const handleSendEmail = () => {
    dispatch(setCurrentView('sendEmail'));
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <Stack spacing={3} sx={{ width: '100%', maxWidth: 400 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleCreateJira}
          sx={{
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 'bold',
          }}
        >
          Create Jira
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleViewJira}
          sx={{
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 'bold',
          }}
        >
          View Jira
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleSendEmail}
          sx={{
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 'bold',
          }}
        >
          Send Email
        </Button>
      </Stack>
    </Box>
  );
};

export default HomeButtons;
