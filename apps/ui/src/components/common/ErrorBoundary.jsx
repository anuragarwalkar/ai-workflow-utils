/**
 * Error boundary component for handling React errors and chunk loading failures gracefully
 */

import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  CleaningServices as ClearCacheIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
  RestartAlt as RetryIcon,
} from '@mui/icons-material';
import { clearAppCacheAndReload, isChunkLoadError } from '../../utils/lazyWithRetry.js';
import { createLogger } from '../../utils/log.js';

const logger = createLogger('ErrorBoundary');

/**
 * Error boundary class component
 */
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    // Update state with error details so the next render will show the fallback UI
    return { hasError: true, error };
  }

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the caught error
    logger.error('componentDidCatch', 'React error boundary caught an error', {
      error: error?.message,
      errorInfo,
      stack: error?.stack,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    logger.info('handleRetry', 'User attempted to retry after error');
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  handleReload = () => {
    logger.info('handleReload', 'User requested page reload');
    window.location.reload();
  };

  handleClearCacheAndReload = async () => {
    logger.info('handleClearCacheAndReload', 'User requested cache clear and reload');
    await clearAppCacheAndReload();
  };

  handleGoHome = () => {
    if (window.location.pathname === '/') {
      this.handleRetry();
    } else {
      window.location.href = '/';
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      const isChunkError = isChunkLoadError(this.state.error);
      const isFullScreen = this.props.fullScreen || false;

      const title = isChunkError
        ? 'Application Update / Loading Issue'
        : 'Something went wrong';

      const message = isChunkError
        ? 'A new version of the application is available or the network connection was interrupted while loading this section.'
        : this.props.friendlyMessage ||
          'An unexpected error occurred while rendering this component. You can retry or reload the page.';

      const content = (
        <Paper
          elevation={isFullScreen ? 4 : 1}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            maxWidth: isFullScreen ? 650 : '100%',
            width: '100%',
            borderRadius: 2,
            border: '1px solid',
            borderColor: isChunkError ? 'info.light' : 'error.light',
            bgcolor: 'background.paper',
          }}
        >
          <Alert
            severity={isChunkError ? 'info' : 'error'}
            sx={{
              mb: 2.5,
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <AlertTitle sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
              {title}
            </AlertTitle>
            <Typography sx={{ mt: 0.5, mb: 1 }} variant="body2">
              {message}
            </Typography>

            {Boolean(this.state.error) && (
              <Box sx={{ mt: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                  onClick={this.toggleDetails}
                >
                  <Typography
                    color="text.secondary"
                    sx={{ fontWeight: 500, fontSize: '0.8rem' }}
                    variant="caption"
                  >
                    Technical Details
                  </Typography>
                  <IconButton size="small">
                    {this.state.showDetails ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Box>
                <Collapse in={this.state.showDetails}>
                  <Box
                    sx={{
                      p: 1.5,
                      mt: 1,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      maxHeight: 180,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      color: 'text.secondary',
                    }}
                  >
                    {this.state.error.message || String(this.state.error)}
                    {Boolean(this.state.error.stack) && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed rgba(128,128,128,0.3)' }}>
                        {this.state.error.stack}
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Box>
            )}
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap" gap={1.5}>
            {isChunkError ? (
              <Button
                color="primary"
                startIcon={<RefreshIcon />}
                variant="contained"
                onClick={this.handleReload}
              >
                Reload Application
              </Button>
            ) : (
              <Button
                color="primary"
                startIcon={<RetryIcon />}
                variant="contained"
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
            )}

            <Button
              color="inherit"
              startIcon={<ClearCacheIcon />}
              variant="outlined"
              onClick={this.handleClearCacheAndReload}
            >
              Clear Cache & Refresh
            </Button>

            <Button
              color="inherit"
              startIcon={<HomeIcon />}
              variant="text"
              onClick={this.handleGoHome}
            >
              Go to Home
            </Button>

            {Boolean(this.props.onReset) && (
              <Button
                color="secondary"
                variant="text"
                onClick={this.props.onReset}
              >
                Reset
              </Button>
            )}
          </Stack>
        </Paper>
      );

      if (isFullScreen) {
        return (
          <Box
            sx={{
              minHeight: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
            }}
          >
            {content}
          </Box>
        );
      }

      return (
        <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', boxSizing: 'border-box' }}>
          {content}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
