import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  DesktopWindows as DesktopIcon,
  Error as ErrorIcon,
  VpnKey as VpnKeyIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const NotificationPermissionBanner = ({ browserPermission, isSupported, onRequestPermission }) => {
  const getPermissionBadge = () => {
    if (!isSupported) {
      return <Chip color='default' label='Not Supported' size='small' variant='outlined' />;
    }
    if (browserPermission === 'granted') {
      return (
        <Chip
          color='success'
          icon={<CheckCircleIcon />}
          label='Permission Granted'
          size='small'
          variant='outlined'
        />
      );
    }
    if (browserPermission === 'denied') {
      return (
        <Chip
          color='error'
          icon={<ErrorIcon />}
          label='Permission Denied / Blocked'
          size='small'
          variant='outlined'
        />
      );
    }
    return (
      <Chip
        color='warning'
        icon={<WarningIcon />}
        label='Needs Permission'
        size='small'
        variant='outlined'
      />
    );
  };

  return (
    <Paper
      sx={{
        alignItems: 'center',
        backgroundColor: 'action.hover',
        borderRadius: 2,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        justifyContent: 'space-between',
        mb: 2,
        p: 2,
      }}
      variant='outlined'
    >
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5 }}>
        <DesktopIcon color='action' />
        <Box>
          <Typography sx={{ fontWeight: 600 }} variant='body2'>
            Browser Desktop Notifications
          </Typography>
          <Typography color='text.secondary' variant='caption'>
            Status: {browserPermission}
          </Typography>
        </Box>
      </Box>

      <Stack alignItems='center' direction='row' spacing={1}>
        {getPermissionBadge()}
        {isSupported && browserPermission !== 'granted' ? (
          <Button
            size='small'
            startIcon={<VpnKeyIcon />}
            variant='contained'
            onClick={onRequestPermission}
          >
            Request Permission
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
};

NotificationPermissionBanner.propTypes = {
  browserPermission: PropTypes.string.isRequired,
  isSupported: PropTypes.bool.isRequired,
  onRequestPermission: PropTypes.func.isRequired,
};

export default NotificationPermissionBanner;
