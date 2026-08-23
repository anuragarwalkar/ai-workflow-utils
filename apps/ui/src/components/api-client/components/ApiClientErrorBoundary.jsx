import React from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        p: 3,
        gap: 2,
      }}
    >
      <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          API Client Error
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Something went wrong with the API Client. Please try refreshing the page.
        </Typography>
        <Button variant="contained" onClick={resetErrorBoundary}>
          Try Again
        </Button>
      </Alert>
    </Box>
  );
};

const ApiClientErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ApiClientErrorBoundary;
