import { Suspense } from 'react';
import AppRoutes from '../routes/AppRoutes';
import NotificationSnackbar from './common/NotificationSnackbar';
import BuildModal from './build/BuildModal';
import LoadingFallback from './common/LoadingFallback';

const AppContent = () => (
  <>
    <Suspense fallback={<LoadingFallback />}>
      <AppRoutes />
    </Suspense>
    <NotificationSnackbar />
    <BuildModal />
  </>
);

export default AppContent;
