import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import { DragIndicator as DragIcon } from '@mui/icons-material';
import RequestBuilder from './RequestBuilder';
import ResponseViewer from './ResponseViewer';

const ApiClientMainPanel = ({ 
  activeEnvironment,
  currentRequest,
  environments,
  glassMorphismStyle,
  loading,
  response,
  onUpdate
}) => {
  const theme = useTheme();
  const containerRef = useRef(null);
  const [requestHeight, setRequestHeight] = useState(60); // Percentage
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e) => {
    setIsResizing(true);
    document.body.style.cursor = 'row-resize';
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Constrain between 30% and 80%
    if (newHeight >= 30 && newHeight <= 80) {
      setRequestHeight(newHeight);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <Box 
      data-main-panel
      display="flex"
      flex={1} 
      flexDirection="column" 
      ref={containerRef}
      sx={{ userSelect: isResizing ? 'none' : 'auto' }}
    >
      {/* Request Builder */}
      <Paper
        elevation={0}
        sx={{
          ...glassMorphismStyle,
          height: `${requestHeight}%`,
          borderRadius: 0,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <RequestBuilder
          activeEnvironment={activeEnvironment}
          environments={environments}
          request={currentRequest}
          onUpdate={onUpdate}
        />
      </Paper>

      {/* Resize Handle */}
      <Box
        sx={{
          height: 8,
          background: alpha(theme.palette.divider, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'row-resize',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.1),
          },
          ...(isResizing && {
            background: alpha(theme.palette.primary.main, 0.2),
          }),
        }}
        onMouseDown={handleMouseDown}
      >
        <DragIcon 
          sx={{ 
            fontSize: 16, 
            color: alpha(theme.palette.text.secondary, 0.5),
            transform: 'rotate(90deg)',
          }} 
        />
      </Box>

      {/* Response Viewer */}
      <Paper
        elevation={0}
        sx={{
          ...glassMorphismStyle,
          height: `${100 - requestHeight}%`,
          borderRadius: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ResponseViewer loading={loading} response={response} />
      </Paper>
    </Box>
  );
};

export default ApiClientMainPanel;
