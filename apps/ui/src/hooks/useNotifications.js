import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectNotificationPermission, setNotificationPermission } from '../store/slices/dashboardSlice';
import { showNotification } from '../store/slices/uiSlice';
import { dashboardApi } from '../store/api/dashboardApi';
import socketService from '../services/socketService';
import { createLogger } from '../utils/log';

const logger = createLogger('USE_NOTIFICATIONS');

export const useNotifications = () => {
  const dispatch = useDispatch();
  const permission = useSelector(selectNotificationPermission);

  // Sync browser notification permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      dispatch(setNotificationPermission(Notification.permission));
    }
  }, [dispatch]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const result = await Notification.requestPermission();
      dispatch(setNotificationPermission(result));
      return result;
    } catch (err) {
      logger.error('requestPermission', 'Failed to request notification permission:', err);
      return 'denied';
    }
  }, [dispatch]);

  // Connect to Socket.IO and listen for server-driven notifications
  useEffect(() => {
    socketService.connect();

    const handleServerNotification = (notificationData) => {
      // Invalidate RTK Query cache to update NotificationCenter badge and list
      dispatch(dashboardApi.util.invalidateTags(['Notification', 'Reminder', 'Todo']));

      // In-app toast feedback
      dispatch(
        showNotification({
          message: notificationData.title
            ? `${notificationData.title}${notificationData.message ? ` - ${notificationData.message}` : ''}`
            : 'New Notification Received',
          severity: notificationData.severity || 'info',
        })
      );

      // Browser Desktop Notification if tab is open & permission granted
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          const browserNotice = new Notification(notificationData.title || 'AI Workflow Notification', {
            body: notificationData.message || 'You have a new alert',
            icon: '/favicon.ico',
            tag: `dashboard-notice-${notificationData.id || Date.now()}`,
          });

          browserNotice.onclick = () => {
            window.focus();
            browserNotice.close();
          };
        } catch (err) {
          logger.warn('handleServerNotification', 'Could not display browser Notification:', err);
        }
      }
    };

    socketService.onVoiceEvent('dashboard:notification', handleServerNotification);

    return () => {
      socketService.offVoiceEvent('dashboard:notification', handleServerNotification);
    };
  }, [dispatch]);

  return { permission, requestPermission };
};

export default useNotifications;
