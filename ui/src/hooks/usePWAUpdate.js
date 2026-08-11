import { useRegisterSW } from 'virtual:pwa-register/react';
import { createLogger } from '../utils/log';

const logger = createLogger('usePWAUpdate');

const usePWAUpdate = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      logger.info('onRegistered', 'Service worker registered', r);
    },
    onRegisterError(error) {
      logger.error('onRegisterError', 'Service worker registration failed', error);
    },
  });

  const forceUpdate = () => {
    logger.info('forceUpdate', 'Forcing service worker update and reload');
    updateServiceWorker(true);
  };

  return { needRefresh, forceUpdate };
};

export default usePWAUpdate;
