/**
 * Error boundary component for handling React errors gracefully
 */

import React from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { createLogger } from '../../utils/log.js';

const logger = createLogger('ErrorBoundary');

/**
 * Error boundary class component
 */
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    logger.error('componentDidCatch', 'React error boundary caught an error', {
      error: error.message,
      errorInfo,
      stack: error.stack,
    });

    // Update state with error details
    this.setState({
      error,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    logger.info('handleRetry', 'User attempted to retry after error');
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <Box sx={{ p: 3, maxWidth: 600 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography gutterBottom variant="h6">
              Something went wrong
            </Typography>
            <Typography sx={{ mb: 2 }} variant="body2">
              {this.props.friendlyMessage || 
                'An unexpected error occurred. Please try again or contact support if the problem persists.'}
            </Typography>
            {!!(this.state.error) && (
              <Typography sx={{ display: 'block', mb: 2, color: 'text.secondary' }} variant="caption">
                Error: {this.state.error.message}
              </Typography>
            )}
            <Button 
              size="small" 
              sx={{ mr: 1 }}
              variant="outlined" 
              onClick={this.handleRetry}
            >
              Try Again
            </Button>
            {!!(this.props.onReset) && (
              <Button 
                size="small" 
                variant="text" 
                onClick={this.props.onReset}
              >
                Reset
              </Button>
            )}
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
