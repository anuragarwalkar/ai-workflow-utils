import React, { useEffect, useRef } from 'react';
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
  Close as CloseIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearCronJobLogs,
} from '../../store/slices/cronJobProgressSlice';
import { log } from '../../utils/log';

const CronJobProgress = ({ jobName, onClose }) => {
  const dispatch = useDispatch();
  const logContainerRef = useRef(null);
  const { isRunning, cronJobLogs, cronJobStatus, cronJobError } = useSelector(
    state => state.cronJobProgress
  );

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [cronJobLogs]);

  const handleClearLogs = () => {
    log('[CRON_JOB_PROGRESS] [handleClearLogs] Clearing logs');
    dispatch(clearCronJobLogs());
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
        return '#888';
    }
  };

  const getStatusChip = () => {
    if (isRunning) {
      return (
        <Chip
          color='primary'
          icon={<CircularProgress size={16} />}
          label='Running...'
          variant='outlined'
        />
      );
    }
    if (cronJobStatus === 'success') {
      return (
        <Chip
          color='success'
          label='Completed Successfully'
          variant='outlined'
        />
      );
    }
    if (cronJobStatus === 'error') {
      return <Chip color='error' label='Failed' variant='outlined' />;
    }
    return <Chip color='default' label='Ready' variant='outlined' />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h6'>
          {jobName} - Execution Progress
        </Typography>
        {getStatusChip()}
      </Box>

      {cronJobError ? (
        <Alert severity='error' sx={{ mb: 2 }}>
          {cronJobError}
        </Alert>
      ) : null}

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          disabled={isRunning}
          size='small'
          startIcon={<ClearIcon />}
          variant='outlined'
          onClick={handleClearLogs}
        >
          Clear Logs
        </Button>
        <Button
          size='small'
          startIcon={<CloseIcon />}
          variant='outlined'
          onClick={onClose}
        >
          Close
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
          minHeight: '400px',
          maxHeight: '500px',
          border: '1px solid #333',
          borderRadius: 1,
        }}
      >
        {cronJobLogs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ color: '#888', fontStyle: 'italic' }}>
              {isRunning
                ? 'Waiting for job output...'
                : 'No logs available'}
            </Typography>
          </Box>
        ) : (
          cronJobLogs.map(logEntry => (
            <Box
              key={`${logEntry.timestamp}-${logEntry.message}`}
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
                [{new Date(logEntry.timestamp).toLocaleTimeString()}]
              </Typography>
              <Typography
                component='span'
                sx={{
                  color: getLogColor(logEntry.logType),
                  fontWeight: logEntry.logType === 'error' ? 'bold' : 'normal',
                }}
              >
                {logEntry.message}
              </Typography>
            </Box>
          ))
        )}
      </Paper>

      {!isRunning && cronJobStatus ? (
        <Typography sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
          Job execution {cronJobStatus}
        </Typography>
      ) : null}
    </Box>
  );
};

export default CronJobProgress;
