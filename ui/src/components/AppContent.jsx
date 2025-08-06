import React, { Suspense } from 'react';
import AppRoutes from '../routes/AppRoutes';
import ConditionalChatOverlay from './chat/ConditionalChatOverlay';
import NotificationSnackbar from './common/NotificationSnackbar';
import BuildModal from './build/BuildModal';
import LoadingFallback from './common/LoadingFallback';

const AppContent = () => (
  <>
    <Suspense fallback={<LoadingFallback />}>
      <AppRoutes />
    </Suspense>
    <ConditionalChatOverlay />
    <NotificationSnackbar />
    <BuildModal />
  </>
);

export default AppContent;
