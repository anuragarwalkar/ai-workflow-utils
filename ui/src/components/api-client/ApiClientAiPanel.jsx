import React from 'react';
import {
  Box,
  Fade,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { 
  SmartToy as AiIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';

const ApiClientAiPanel = ({ glassMorphismStyle, isCollapsed, onToggleCollapse }) => {
  const { isDark } = useAppTheme();
  
  if (isCollapsed) {
    return (
      <Box
        sx={{
          position: 'fixed',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
        }}
      >
        <Tooltip placement="left" title="Open AI Assistant">
          <IconButton
            size="large"
            sx={{
              background: alpha('#ff9a9e', 0.1),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha('#ff9a9e', 0.2)}`,
              color: '#ff9a9e',
              '&:hover': {
                background: alpha('#ff9a9e', 0.2),
                transform: 'scale(1.1)',
              },
              transition: 'all 0.3s ease',
            }}
            onClick={onToggleCollapse}
          >
            <AiIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        ...glassMorphismStyle,
        ...(isDark && {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }),
        width: 320,
        borderRadius: 0,
        borderLeft: `1px solid ${alpha(isDark ? '#ffffff' : '#000000', 0.1)}`,
        display: 'flex',
        flexDirection: 'column',
        background: isDark ? '#1E1E1E' : alpha('#ff9a9e', 0.05),
        position: 'relative',
        transition: 'width 0.3s ease',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 1,
        }}
      >
        <Tooltip title="Collapse AI Panel">
          <IconButton
            size="small"
            sx={{
              background: alpha(isDark ? '#ffffff' : '#ffffff', 0.1),
              color: isDark ? '#E0E0E0' : 'inherit',
              '&:hover': {
                background: alpha(isDark ? '#ffffff' : '#ffffff', 0.2),
              },
            }}
            onClick={onToggleCollapse}
          >
            <ChevronRightIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
        }}
      >
        <Fade in timeout={1000}>
          <Box textAlign="center">
            <AiIcon sx={{ fontSize: 64, color: '#ff9a9e', mb: 2 }} />
            <Typography 
              color={isDark ? '#E0E0E0' : 'text.secondary'} 
              variant="h6"
            >
              AI Assistant
            </Typography>
            <Typography 
              color={isDark ? '#A0A0A0' : 'text.secondary'} 
              sx={{ mt: 1 }} 
              variant="body2"
            >
              Coming Soon...
            </Typography>
            <Typography 
              color={isDark ? '#A0A0A0' : 'text.secondary'} 
              sx={{ mt: 2, display: 'block' }} 
              variant="caption"
            >
              Future AI features will help generate requests,
              explain responses, and automate API testing
            </Typography>
          </Box>
        </Fade>
      </Box>
    </Paper>
  );
};

export default ApiClientAiPanel;
