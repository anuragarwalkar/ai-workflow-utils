import { configureStore } from '@reduxjs/toolkit';
import appSlice from './slices/appSlice';
import jiraSlice from './slices/jiraSlice';
import emailSlice from './slices/emailSlice';
import uiSlice from './slices/uiSlice';
import buildSlice from './slices/buildSlice';
import { jiraApi } from './api/jiraApi';
import { emailApi } from './api/emailApi';
import { buildApi } from './api/buildApi';

const store = configureStore({
  reducer: {
    app: appSlice,
    jira: jiraSlice,
    email: emailSlice,
    ui: uiSlice,
    build: buildSlice,
    [jiraApi.reducerPath]: jiraApi.reducer,
    [emailApi.reducerPath]: emailApi.reducer,
    [buildApi.reducerPath]: buildApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['jira/setImageFile'],
        ignoredPaths: ['jira.createJira.imageFile'],
      },
    }).concat(jiraApi.middleware, emailApi.middleware, buildApi.middleware),
});

// Export store for use in components
export { store };
export default store;
