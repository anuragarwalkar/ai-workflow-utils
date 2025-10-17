import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import notificationService from '../services/notificationService';
import socketService from '../services/socketService';
import { log } from '../utils/log';

export const useNotifications = () => {
  const isConnected = useSelector(state => state.ui?.isConnected);

  useEffect(() => {
    const requestPermission = async () => {
      if (notificationService.isSupported()) {
        const permission = await notificationService.requestPermission();
        log('[USE_NOTIFICATIONS] [requestPermission] Notification permission:', permission);
      }
    };

    requestPermission();
  }, []);

  useEffect(() => {
    if (!isConnected) {
      return undefined;
    }

    const handleCronJobStarted = (data) => {
      log('[USE_NOTIFICATIONS] [handleCronJobStarted] Cron job started', data);
      notificationService.showCronJobStarted(data.jobName);
    };

    const handleCronJobCompleted = (data) => {
      log('[USE_NOTIFICATIONS] [handleCronJobCompleted] Cron job completed', data);
      if (data.success) {
        notificationService.showCronJobSuccess(data.jobName);
      } else {
        notificationService.showCronJobFailure(data.jobName, data.error);
      }
    };

    const handleCronJobFailed = (data) => {
      log('[USE_NOTIFICATIONS] [handleCronJobFailed] Cron job failed', data);
      notificationService.showCronJobFailure(data.jobName, data.error);
    };

    // Listen for cron job events
    socketService.on('cronJobStarted', handleCronJobStarted);
    socketService.on('cronJobCompleted', handleCronJobCompleted);
    socketService.on('cronJobFailed', handleCronJobFailed);

    return () => {
      socketService.off('cronJobStarted', handleCronJobStarted);
      socketService.off('cronJobCompleted', handleCronJobCompleted);
      socketService.off('cronJobFailed', handleCronJobFailed);
    };
  }, [isConnected]);

  return {
    showNotification: notificationService.show.bind(notificationService),
    showCronJobSuccess: notificationService.showCronJobSuccess.bind(notificationService),
    showCronJobFailure: notificationService.showCronJobFailure.bind(notificationService),
    showCronJobStarted: notificationService.showCronJobStarted.bind(notificationService),
    isSupported: notificationService.isSupported(),
    canShow: notificationService.canShow(),
  };
};

export default useNotifications;