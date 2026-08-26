// API Client Library Index
// This file serves as the main entry point for the API Client library

// Core Components
export { default as ApiClient } from './ApiClientMigrated';
export { default as ApiClientHeader } from './ApiClientHeader';
export { default as ApiClientSidebar } from './ApiClientSidebar';
export { default as ApiClientMainPanel } from './ApiClientMainPanel';
export { default as ApiClientAiPanel } from './ApiClientAiPanel';

// ViewModels (Custom Hooks)
export { useApiClientViewModel } from './viewModels/useApiClientViewModel';
export { useEnvironmentViewModel } from './viewModels/useEnvironmentViewModel';
export { useCollectionsViewModel } from './viewModels/useCollectionsViewModel';
export { useUiStateViewModel } from './viewModels/useUiStateViewModel';

// Models and Types
export * from './models/apiClientModels';

// Redux Store Components
import { apiClientApi } from '../../store/api/apiClientApi';
import apiClientSlice from '../../store/slices/apiClientSlice';

export { apiClientApi };
export { default as apiClientSlice } from '../../store/slices/apiClientSlice';
export * from '../../store/slices/apiClientSlice';

// Library Configuration
export const API_CLIENT_CONFIG = {
  name: '@your-org/api-client-lib',
  version: '1.0.0',
  description: 'A modular API client library built with React, Redux Toolkit Query, and functional programming patterns',
  dependencies: {
    'react': '^18.0.0',
    'react-redux': '^8.0.0',
    '@reduxjs/toolkit': '^1.9.0',
    '@mui/material': '^5.0.0',
  },
  peerDependencies: {
    'react': '>=18.0.0',
    'react-dom': '>=18.0.0',
  }
};

// Library Setup Helper
export const setupApiClientStore = (existingStore) => {
  // Helper function to configure the store with API client reducers and middleware
  // This would be used when integrating the library into an existing Redux store
  return {
    reducer: {
      ...existingStore?.reducer,
      apiClient: apiClientSlice,
      [apiClientApi.reducerPath]: apiClientApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiClientApi.middleware),
  };
};
