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
    <Typography sx={{ fontWeight: 600, mb: 1 }} variant='body2'>
      Quick Toast Presets
    </Typography>

    <Stack direction='row' flexWrap='wrap' gap={1} sx={{ mb: 3 }}>
      <Button
        color='success'
        size='small'
        startIcon={<CheckCircleIcon />}
        variant='outlined'
        onClick={() => onTriggerToast('Success: Action completed successfully!', 'success')}
      >
        Success Toast
      </Button>
      <Button
        color='info'
        size='small'
        startIcon={<InfoIcon />}
        variant='outlined'
        onClick={() => onTriggerToast('Info: Background task update received.', 'info')}
      >
        Info Toast
      </Button>
      <Button
        color='warning'
        size='small'
        startIcon={<WarningIcon />}
        variant='outlined'
        onClick={() => onTriggerToast('Warning: High resource usage detected.', 'warning')}
      >
        Warning Toast
      </Button>
      <Button
        color='error'
        size='small'
        startIcon={<ErrorIcon />}
        variant='outlined'
        onClick={() => onTriggerToast('Error: Failed to process requested operation.', 'error')}
      >
        Error Toast
      </Button>
      <Button
        color='secondary'
        disabled={!isSupported || browserPermission !== 'granted'}
        size='small'
        startIcon={<DesktopIcon />}
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
