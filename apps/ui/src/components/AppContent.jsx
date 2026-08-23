import { Suspense } from 'react';
import AppRoutes from '../routes/AppRoutes';
import NotificationSnackbar from './common/NotificationSnackbar';
import BuildModal from './build/BuildModal';
import LoadingFallback from './common/LoadingFallback';
import ErrorBoundary from './common/ErrorBoundary';

const AppContent = () => (
  <ErrorBoundary fullScreen friendlyMessage="An error occurred in the application. Please reload or return to Home.">
    <Suspense fallback={<LoadingFallback />}>
      <AppRoutes />
    </Suspense>
    <NotificationSnackbar />
    <BuildModal />
  </ErrorBoundary>
);

export default AppContent;
