import React from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { hideNotification } from '../../store/slices/uiSlice';

const NotificationSnackbar = () => {
  const dispatch = useDispatch();
  const { message, severity, open } = useSelector(state => state.ui.notifications);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(hideNotification());
  };

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={6000}
      open={open}
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        '& .MuiSnackbar-root': {
          position: 'static',
        },
      }}
      onClose={handleClose}
    >
      <Alert
        severity={severity}
        sx={{
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        onClose={handleClose}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;
