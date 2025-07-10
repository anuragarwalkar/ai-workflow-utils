import { configureStore } from '@reduxjs/toolkit';
import appSlice from './slices/appSlice';
import jiraSlice from './slices/jiraSlice';
import uiSlice from './slices/uiSlice';
import { jiraApi } from './api/jiraApi';

const store = configureStore({
  reducer: {
    app: appSlice,
    jira: jiraSlice,
    ui: uiSlice,
    [jiraApi.reducerPath]: jiraApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['jira/setImageFile'],
        ignoredPaths: ['jira.createJira.imageFile'],
      },
    }).concat(jiraApi.middleware),
});

// Export store for use in components
export { store };
export default store;
