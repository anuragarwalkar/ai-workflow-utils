 
 
import { useEffect, useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import {
  Clear as ClearIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { clearBuildLogs } from '../../store/slices/buildSlice';
import { setCurrentView } from '../../store/slices/appSlice';
import socketService from '../../services/socketService';

const BuildProgress = ({ onReset, onBack }) => {
  const dispatch = useDispatch();
  const logContainerRef = useRef(null);

  const { isBuilding, buildLogs, buildStatus, error, buildConfig, branchName } =
    useSelector(state => state.build);


  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [buildLogs]);

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
          color='primary'
          icon={<CircularProgress size={16} />}
          label='Building...'
          variant='outlined'
        />
      );
    }

    if (buildStatus === 'success') {
      return (
        <Chip
          color='success'
          label='Build Completed Successfully'
          variant='outlined'
        />
      );
    }

    if (buildStatus === 'error') {
      return <Chip color='error' label='Build Failed' variant='outlined' />;
    }

    return <Chip color='default' label='Ready to Start' variant='outlined' />;
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

      {error ? (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          disabled={isBuilding}
          size='small'
          startIcon={<ClearIcon />}
          variant='outlined'
          onClick={handleClearLogs}
        >
          Clear Logs
        </Button>

        <Button
          disabled={isBuilding}
          size='small'
          startIcon={<RefreshIcon />}
          variant='outlined'
          onClick={onReset}
        >
          Reset
        </Button>

        <Button
          size='small'
          startIcon={<HomeIcon />}
          variant='outlined'
          onClick={handleGoHome}
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
          <Typography color='text.secondary' display='block' variant='caption'>
            WebSocket Status:{' '}
            {socketService.isSocketConnected()
              ? '🟢 Connected'
              : '🔴 Disconnected'}
          </Typography>
          {buildConfig?.createPullRequest ? (
            <Typography
              color='text.secondary'
              display='block'
              variant='caption'
            >
              Branch: {branchName || 'Not captured yet'}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Manual PR Creation Button */}
          {buildConfig?.createPullRequest &&
          buildStatus === 'success' ? branchName : null}

          {!isBuilding && buildStatus ? (
            <Button variant='outlined' onClick={onReset}>
              Start New Build
            </Button>
          ) : null}
          <Button disabled={isBuilding} onClick={onBack}>
            Back
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default BuildProgress;
