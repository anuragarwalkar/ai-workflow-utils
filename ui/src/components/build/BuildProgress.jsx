import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  CallMerge as PullRequestIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { clearBuildLogs } from '../../store/slices/buildSlice';
import { setCurrentView } from '../../store/slices/appSlice';
import { useCreatePullRequestMutation } from '../../store/api/prApi';
import socketService from '../../services/socketService';

const BuildProgress = ({ onReset, onBack }) => {
  const dispatch = useDispatch();
  const logContainerRef = useRef(null);
  const [prStatus, setPrStatus] = useState(null); // 'creating', 'success', 'error'
  const [prError, setPrError] = useState(null);
  const [prData, setPrData] = useState(null);

  const { isBuilding, buildLogs, buildStatus, error, buildConfig, branchName } =
    useSelector(state => state.build);

  const [createPullRequest] = useCreatePullRequestMutation();

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [buildLogs]);

  // Handle automatic PR creation when build completes successfully
  useEffect(() => {
    const shouldCreatePR =
      buildStatus === 'success' &&
      buildConfig?.createPullRequest &&
      branchName &&
      buildConfig.ticketNumber &&
      buildConfig.selectedPackages?.length > 0 &&
      prStatus !== 'creating' &&
      prStatus !== 'success';

    if (shouldCreatePR) {
      handleCreatePullRequest();
    }
  }, [buildStatus, buildConfig, branchName, prStatus]);

  const handleCreatePullRequest = async () => {
    if (!buildConfig || !branchName) {
      setPrError('Missing build configuration or branch name');
      return;
    }

    if (!buildConfig.repoKey || !buildConfig.repoSlug) {
      setPrError('Missing repository key or repository slug configuration');
      return;
    }

    try {
      setPrStatus('creating');
      setPrError(null);

      // Create comma-separated list of package short names
      const getPackageShortName = packageName => {
        const parts = packageName.split('-');
        return parts[parts.length - 1];
      };

      const updatedList = buildConfig.selectedPackages
        .map(getPackageShortName)
        .join(', ');

      const result = await createPullRequest({
        ticketNumber: buildConfig.ticketNumber,
        updatedList,
        branchName,
        projectKey: buildConfig.repoKey,
        repoSlug: buildConfig.repoSlug,
      }).unwrap();

      setPrStatus('success');
      setPrData(result);
      console.log('Pull request created successfully:', result);
    } catch (error) {
      setPrStatus('error');
      setPrError(
        error.data?.error || error.message || 'Failed to create pull request'
      );
      console.error('Failed to create pull request:', error);
    }
  };

  const handleClearLogs = () => {
    dispatch(clearBuildLogs());
  };

  const handleGoHome = () => {
    dispatch(setCurrentView('home'));
  };

  const getLogColor = logType => {
    switch (logType) {
      case 'start':
        return '#2196f3';
      case 'stdout':
        return '#4caf50';
      case 'stderr':
        return '#ff9800';
      case 'error':
        return '#f44336';
      case 'success':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  const getStatusChip = () => {
    if (isBuilding) {
      return (
        <Chip
          icon={<CircularProgress size={16} />}
          label='Building...'
          color='primary'
          variant='outlined'
        />
      );
    }

    if (buildStatus === 'success') {
      return (
        <Chip
          label='Build Completed Successfully'
          color='success'
          variant='outlined'
        />
      );
    }

    if (buildStatus === 'error') {
      return <Chip label='Build Failed' color='error' variant='outlined' />;
    }

    return <Chip label='Ready to Start' color='default' variant='outlined' />;
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h6'>Build Progress</Typography>
        {getStatusChip()}
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Pull Request Status */}
      {buildConfig?.createPullRequest && (
        <Box sx={{ mb: 3 }}>
          {prStatus === 'creating' && (
            <Alert
              severity='info'
              icon={<CircularProgress size={20} />}
              sx={{ mb: 2 }}
            >
              Creating pull request automatically...
            </Alert>
          )}

          {prStatus === 'success' && prData && (
            <Alert severity='success' sx={{ mb: 2 }}>
              <Box>
                <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                  Pull request created successfully!
                </Typography>
                <Typography variant='body2' sx={{ mt: 1 }}>
                  Title: {prData.prTitle}
                </Typography>
                {prData.pullRequest?.links?.self?.[0]?.href && (
                  <Typography variant='body2' sx={{ mt: 1 }}>
                    <a
                      href={prData.pullRequest.links.self[0].href}
                      target='_blank'
                      rel='noopener noreferrer'
                      style={{ color: 'inherit', textDecoration: 'underline' }}
                    >
                      View Pull Request
                    </a>
                  </Typography>
                )}
              </Box>
            </Alert>
          )}

          {prStatus === 'error' && prError && (
            <Alert severity='error' sx={{ mb: 2 }}>
              <Box>
                <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                  Failed to create pull request
                </Typography>
                <Typography variant='body2' sx={{ mt: 1 }}>
                  {prError}
                </Typography>
                <Button
                  size='small'
                  startIcon={<PullRequestIcon />}
                  onClick={handleCreatePullRequest}
                  sx={{ mt: 1 }}
                  variant='outlined'
                >
                  Retry PR Creation
                </Button>
              </Box>
            </Alert>
          )}

          {buildStatus === 'success' && !branchName && (
            <Alert severity='warning' sx={{ mb: 2 }}>
              Build completed successfully, but branch name was not captured
              from the build process. Pull request cannot be created
              automatically.
            </Alert>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant='outlined'
          startIcon={<ClearIcon />}
          onClick={handleClearLogs}
          disabled={isBuilding}
          size='small'
        >
          Clear Logs
        </Button>

        <Button
          variant='outlined'
          startIcon={<RefreshIcon />}
          onClick={onReset}
          disabled={isBuilding}
          size='small'
        >
          Reset
        </Button>

        <Button
          variant='outlined'
          startIcon={<HomeIcon />}
          onClick={handleGoHome}
          size='small'
        >
          Go Home
        </Button>
      </Box>

      <Paper
        ref={logContainerRef}
        sx={{
          p: 2,
          backgroundColor: '#1e1e1e',
          color: '#fff',
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '13px',
          overflow: 'auto',
          minHeight: '500px',
          maxHeight: '600px',
          border: '1px solid #333',
          borderRadius: 2,
        }}
      >
        {buildLogs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography
              sx={{
                color: '#888',
                fontStyle: 'italic',
              }}
            >
              {isBuilding
                ? 'Waiting for build output...'
                : 'No build logs yet. Start the build process to see live output here.'}
            </Typography>
          </Box>
        ) : (
          buildLogs.map(log => (
            <Box
              key={log.id}
              sx={{
                mb: 0.5,
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              <Typography
                component='span'
                sx={{
                  color: '#888',
                  fontSize: '11px',
                  mr: 1,
                }}
              >
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </Typography>
              <Typography
                component='span'
                sx={{
                  color: getLogColor(log.type),
                  fontWeight: log.type === 'error' ? 'bold' : 'normal',
                }}
              >
                {log.message}
              </Typography>
            </Box>
          ))
        )}
      </Paper>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 2,
        }}
      >
        <Box>
          <Typography variant='caption' color='text.secondary' display='block'>
            WebSocket Status:{' '}
            {socketService.isSocketConnected()
              ? '🟢 Connected'
              : '🔴 Disconnected'}
          </Typography>
          {buildConfig?.createPullRequest && (
            <Typography
              variant='caption'
              color='text.secondary'
              display='block'
            >
              Branch: {branchName || 'Not captured yet'}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Manual PR Creation Button */}
          {buildConfig?.createPullRequest &&
            buildStatus === 'success' &&
            branchName &&
            prStatus !== 'success' &&
            prStatus !== 'creating' && (
              <Button
                variant='contained'
                startIcon={<PullRequestIcon />}
                onClick={handleCreatePullRequest}
                size='small'
                color='primary'
              >
                Create PR
              </Button>
            )}

          {!isBuilding && buildStatus && (
            <Button onClick={onReset} variant='outlined'>
              Start New Build
            </Button>
          )}
          <Button onClick={onBack} disabled={isBuilding}>
            Back
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default BuildProgress;
