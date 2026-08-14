import React, { useEffect, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { NotificationsActive as NotificationsActiveIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../../store/slices/uiSlice';
import { setNotificationPermission } from '../../../store/slices/dashboardSlice';
import NotificationPermissionBanner from './notifications/NotificationPermissionBanner';
import NotificationPresets from './notifications/NotificationPresets';
import NotificationComposer from './notifications/NotificationComposer';

const NotificationTester = () => {
  const dispatch = useDispatch();
  const [browserPermission, setBrowserPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
      dispatch(setNotificationPermission(Notification.permission));
      setIsSupported(true);
    } else {
      setIsSupported(false);
      setBrowserPermission('unsupported');
    }
  }, [dispatch]);

  const requestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      dispatch(
        showNotification({
          message: 'Web Notifications are not supported in this browser.',
          severity: 'error',
        })
      );
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setBrowserPermission(result);
      dispatch(setNotificationPermission(result));

      if (result === 'granted') {
        dispatch(
          showNotification({
            message: 'Browser notification permission granted!',
            severity: 'success',
          })
        );
      } else if (result === 'denied') {
        dispatch(
          showNotification({
            message: 'Notification permission was denied. Please enable it in browser settings.',
            severity: 'warning',
          })
        );
      }
    } catch (err) {
      dispatch(
        showNotification({
          message: `Failed to request notification permission: ${err.message}`,
          severity: 'error',
        })
      );
    }
  };

  const triggerToast = (message, severity = 'info') => {
    dispatch(showNotification({ message, severity }));
  };

  const triggerBrowserNotification = (title, body) => {
    if (!isSupported) {
      dispatch(
        showNotification({
          message: 'Web Notifications API is not supported in this browser.',
          severity: 'error',
        })
      );
      return;
    }

    if (Notification.permission === 'denied') {
      dispatch(
        showNotification({
          message: 'Browser notifications are blocked. Enable them in site permissions.',
          severity: 'warning',
        })
      );
      return;
    }

    if (Notification.permission !== 'granted') {
      requestBrowserPermission();
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `ai-workflow-test-${Date.now()}`,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      dispatch(
        showNotification({
          message: `Failed to show browser notification: ${err.message}`,
          severity: 'error',
        })
      );
    }
  };

  const handleSendNotification = ({ message, severity, target, title }) => {
    const finalTitle = title?.trim() || 'AI Workflow Test';
    const finalMessage = message?.trim() || 'Test notification message';

    if (target === 'toast' || target === 'both') {
      triggerToast(finalMessage, severity);
    }
    if (target === 'browser' || target === 'both') {
      triggerBrowserNotification(finalTitle, finalMessage);
    }
  };

  return (
    <Box sx={{ my: 2 }}>
      <Typography
        gutterBottom
        sx={{ alignItems: 'center', display: 'flex', gap: 1 }}
        variant='subtitle1'
      >
        <NotificationsActiveIcon color='primary' fontSize='small' />
        Notification Testing &amp; Diagnostics
      </Typography>

      <Typography color='text.secondary' sx={{ mb: 2 }} variant='body2'>
        Test in-app toast alerts and system desktop push notifications to verify delivery.
      </Typography>

      <NotificationPermissionBanner
        browserPermission={browserPermission}
        isSupported={isSupported}
        onRequestPermission={requestBrowserPermission}
      />

      {browserPermission === 'denied' ? (
        <Alert severity='warning' sx={{ mb: 2 }}>
          Browser notifications are blocked. Enable notifications in your browser&apos;s site
          settings.
        </Alert>
      ) : null}

      <NotificationPresets
        browserPermission={browserPermission}
        isSupported={isSupported}
        onTriggerBrowser={triggerBrowserNotification}
        onTriggerToast={triggerToast}
      />

      <NotificationComposer onSendNotification={handleSendNotification} />
    </Box>
  );
};

export default NotificationTester;
