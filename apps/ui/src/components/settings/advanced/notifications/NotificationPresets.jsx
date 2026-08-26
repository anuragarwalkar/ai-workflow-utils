import React from 'react';
import PropTypes from 'prop-types';
import { Button, Stack, Typography } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  DesktopWindows as DesktopIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const NotificationPresets = ({
  browserPermission,
  isSupported,
  onTriggerBrowser,
  onTriggerToast,
}) => (
  <>
    <Typography sx={{ fontWeight: 600, mb: 1.5 }} variant='subtitle2'>
      Quick Toast Presets
    </Typography>

    <Stack direction='row' flexWrap='wrap' gap={1.5} sx={{ mb: 3.5 }}>
      <Button
        color='success'
        size='medium'
        startIcon={<CheckCircleIcon />}
        sx={{ px: 2, py: 0.8 }}
        variant='outlined'
        onClick={() => onTriggerToast('Success: Action completed successfully!', 'success')}
      >
        Success Toast
      </Button>
      <Button
        color='info'
        size='medium'
        startIcon={<InfoIcon />}
        sx={{ px: 2, py: 0.8 }}
        variant='outlined'
        onClick={() => onTriggerToast('Info: Background task update received.', 'info')}
      >
        Info Toast
      </Button>
      <Button
        color='warning'
        size='medium'
        startIcon={<WarningIcon />}
        sx={{ px: 2, py: 0.8 }}
        variant='outlined'
        onClick={() => onTriggerToast('Warning: High resource usage detected.', 'warning')}
      >
        Warning Toast
      </Button>
      <Button
        color='error'
        size='medium'
        startIcon={<ErrorIcon />}
        sx={{ px: 2, py: 0.8 }}
        variant='outlined'
        onClick={() => onTriggerToast('Error: Failed to process requested operation.', 'error')}
      >
        Error Toast
      </Button>
      <Button
        color='secondary'
        disabled={!isSupported || browserPermission !== 'granted'}
        size='medium'
        startIcon={<DesktopIcon />}
        sx={{ px: 2, py: 0.8 }}
        variant='outlined'
        onClick={() =>
          onTriggerBrowser(
            'AI Workflow Desktop Alert',
            'This is a native browser desktop notification test!'
          )
        }
      >
        Desktop Alert
      </Button>
    </Stack>
  </>
);

NotificationPresets.propTypes = {
  browserPermission: PropTypes.string.isRequired,
  isSupported: PropTypes.bool.isRequired,
  onTriggerBrowser: PropTypes.func.isRequired,
  onTriggerToast: PropTypes.func.isRequired,
};

export default NotificationPresets;
