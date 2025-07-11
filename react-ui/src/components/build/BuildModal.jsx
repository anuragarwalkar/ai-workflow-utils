import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setBuildModalOpen, 
  clearBuildLogs, 
  resetBuildState,
  startBuild 
} from '../../store/slices/buildSlice';
import { useStartBuildMutation } from '../../store/api/buildApi';
import socketService from '../../services/socketService';

const BuildModal = () => {
  const dispatch = useDispatch();
  const logContainerRef = useRef(null);
  const [startBuildMutation, { isLoading: isStartingBuild }] = useStartBuildMutation();
  
  const { 
    isModalOpen, 
    isBuilding, 
    buildLogs, 
    buildStatus, 
    error 
  } = useSelector((state) => state.build);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [buildLogs]);

  // Connect to WebSocket when modal opens
  useEffect(() => {
    if (isModalOpen) {
      socketService.connect();
    }
    
    return () => {
      // Don't disconnect on unmount as other components might use it
    };
  }, [isModalOpen]);

  const handleClose = () => {
    dispatch(setBuildModalOpen(false));
  };

  const handleStartBuild = async () => {
    try {
      // Clear previous logs
      dispatch(clearBuildLogs());
      
      // Start the build process
      const result = await startBuildMutation().unwrap();
      
      // Update Redux state
      dispatch(startBuild({ buildId: result.buildId }));
      
    } catch (error) {
      console.error('Failed to start build:', error);
    }
  };

  const handleClearLogs = () => {
    dispatch(clearBuildLogs());
  };

  const handleReset = () => {
    dispatch(resetBuildState());
  };

  const getLogColor = (logType) => {
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
          label="Building..."
          color="primary"
          variant="outlined"
        />
      );
    }
    
    if (buildStatus === 'success') {
      return (
        <Chip
          label="Build Completed"
          color="success"
          variant="outlined"
        />
      );
    }
    
    if (buildStatus === 'error') {
      return (
        <Chip
          label="Build Failed"
          color="error"
          variant="outlined"
        />
      );
    }
    
    return (
      <Chip
        label="Ready"
        color="default"
        variant="outlined"
      />
    );
  };

  return (
    <Dialog
      open={isModalOpen}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '800px',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">Mobile App Build Release</Typography>
          {getStatusChip()}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2, mb: 1 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={isBuilding ? <StopIcon /> : <PlayArrowIcon />}
              onClick={handleStartBuild}
              disabled={isStartingBuild || isBuilding}
              color={isBuilding ? "error" : "primary"}
            >
              {isBuilding ? 'Building...' : 'Start Build'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearLogs}
              disabled={isBuilding}
            >
              Clear Logs
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={isBuilding}
            >
              Reset
            </Button>
          </Box>
        </Box>

        <Paper
          ref={logContainerRef}
          sx={{
            flex: 1,
            m: 2,
            mt: 0,
            p: 2,
            backgroundColor: '#1e1e1e',
            color: '#fff',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: '13px',
            overflow: 'auto',
            minHeight: '400px',
            border: '1px solid #333',
          }}
        >
          {buildLogs.length === 0 ? (
            <Typography
              sx={{
                color: '#888',
                fontStyle: 'italic',
                textAlign: 'center',
                mt: 4,
              }}
            >
              No build logs yet. Click "Start Build" to begin the process.
            </Typography>
          ) : (
            buildLogs.map((log) => (
              <Box
                key={log.id}
                sx={{
                  mb: 0.5,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    color: '#888',
                    fontSize: '11px',
                    mr: 1,
                  }}
                >
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </Typography>
                <Typography
                  component="span"
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
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          WebSocket Status: {socketService.isSocketConnected() ? '🟢 Connected' : '🔴 Disconnected'}
        </Typography>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BuildModal;
