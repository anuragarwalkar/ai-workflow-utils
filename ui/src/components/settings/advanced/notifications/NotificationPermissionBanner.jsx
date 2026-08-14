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
      return <Chip color='default' label='Not Supported' size='medium' variant='outlined' />;
    }
    if (browserPermission === 'granted') {
      return (
        <Chip
          color='success'
          icon={<CheckCircleIcon />}
          label='Permission Granted'
          size='medium'
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
          size='medium'
          variant='outlined'
        />
      );
    }
    return (
      <Chip
        color='warning'
        icon={<WarningIcon />}
        label='Needs Permission'
        size='medium'
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
        gap: 2,
        justifyContent: 'space-between',
        mb: 2.5,
        p: 2.5,
      }}
      variant='outlined'
    >
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
        <DesktopIcon color='action' sx={{ fontSize: 28 }} />
        <Box>
          <Typography sx={{ fontWeight: 600 }} variant='subtitle2'>
            Browser Desktop Notifications
          </Typography>
          <Typography color='text.secondary' variant='body2'>
            Status: {browserPermission}
          </Typography>
        </Box>
      </Box>

      <Stack alignItems='center' direction='row' spacing={1.5}>
        {getPermissionBadge()}
        {isSupported && browserPermission !== 'granted' ? (
          <Button
            size='medium'
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
