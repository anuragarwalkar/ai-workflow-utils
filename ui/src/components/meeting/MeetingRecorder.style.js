import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

/**
 * Meeting Recorder Styles - Material-UI styled components
 */
export const MeetingRecorderStyles = styled(Box)(({ theme }) => ({
  '.recorder-container': {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  },

  '.error-alert': {
    marginBottom: theme.spacing(2),
  },

  '.setup-card, .recording-card, .audio-info-card': {
    borderRadius: theme.spacing(1),
    boxShadow: theme.shadows[2],
  },

  '.section-title': {
    marginBottom: theme.spacing(2),
    fontWeight: 600,
    color: theme.palette.primary.main,
  },

  '.form-section': {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },

  '.audio-settings': {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(2),
  },

  '.menu-item': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },

  '.start-button': {
    height: 56,
    fontSize: '1.1rem',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '&:hover': {
      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
    },
  },

  '.stop-button': {
    height: 56,
    fontSize: '1.1rem',
    fontWeight: 600,
    backgroundColor: theme.palette.error.main,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
  },

  '.recording-header': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },

  '.recording-indicator': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },

  '.recording-icon': {
    color: theme.palette.error.main,
    animation: 'pulse 2s infinite',
  },

  '.recording-text': {
    color: theme.palette.error.main,
    fontWeight: 600,
  },

  '.recording-duration': {
    fontFamily: 'monospace',
    fontWeight: 700,
    color: theme.palette.primary.main,
  },

  '.section-divider': {
    margin: theme.spacing(2, 0),
  },

  '.recording-details': {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },

  '.detail-item': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },

  '.audio-source-chip': {
    marginLeft: theme.spacing(1),
  },

  '.audio-sources-list': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },

  '.audio-source-item': {
    display: 'flex',
    alignItems: 'center',
  },

  // Responsive design
  [theme.breakpoints.down('md')]: {
    '.audio-settings': {
      gridTemplateColumns: '1fr',
    },
  },
}));
