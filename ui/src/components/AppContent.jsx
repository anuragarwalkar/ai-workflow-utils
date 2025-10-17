import { Suspense } from 'react';
import AppRoutes from '../routes/AppRoutes';
import NotificationSnackbar from './common/NotificationSnackbar';
import BuildModal from './build/BuildModal';
import LoadingFallback from './common/LoadingFallback';
import useNotifications from '../hooks/useNotifications';

const AppContent = () => {
  // Initialize notifications
  useNotifications();

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <AppRoutes />
      </Suspense>
      <NotificationSnackbar />
      <BuildModal />
    </>
  );
};

export default AppContent;
