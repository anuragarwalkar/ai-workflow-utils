import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

/**
 * Meeting Styles - Material-UI styled components for meeting interface
 * Follows project styling patterns
 */
export const MeetingStyles = styled(Box)(({ theme }) => ({
  '.meeting-container': {
    maxWidth: 1200,
    margin: '0 auto',
    padding: theme.spacing(3),
    minHeight: 'calc(100vh - 100px)',
  },

  '.meeting-header': {
    marginBottom: theme.spacing(3),
    textAlign: 'center',
  },

  '.meeting-title': {
    fontWeight: 600,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: theme.spacing(1),
  },

  '.meeting-subtitle': {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },

  '.recording-alert': {
    maxWidth: 400,
    margin: '0 auto',
    '& .pulsing-icon': {
      animation: 'pulse 2s infinite',
    },
  },

  '.meeting-card': {
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[4],
    overflow: 'hidden',
    marginBottom: theme.spacing(3),
  },

  '.tabs-container': {
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },

  '.meeting-tabs': {
    '& .MuiTab-root': {
      minHeight: 72,
      textTransform: 'none',
      fontSize: '1rem',
      fontWeight: 500,
      '&.Mui-selected': {
        color: theme.palette.primary.main,
      },
    },
  },

  '.meeting-tab': {
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },

  '.tab-content': {
    padding: theme.spacing(3),
    minHeight: 500,
  },

  '.feature-status': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },

  '.feature-note': {
    color: theme.palette.text.secondary,
  },

  // Keyframe animations
  '@keyframes pulse': {
    '0%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
    '100%': {
      opacity: 1,
    },
  },

  // Responsive design
  [theme.breakpoints.down('md')]: {
    '.meeting-container': {
      padding: theme.spacing(2),
    },
    '.tab-content': {
      padding: theme.spacing(2),
    },
  },

  [theme.breakpoints.down('sm')]: {
    '.meeting-tabs': {
      '& .MuiTab-root': {
        minHeight: 64,
        fontSize: '0.875rem',
      },
    },
  },
}));
