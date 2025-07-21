import { configureStore } from '@reduxjs/toolkit';
import appSlice from './slices/appSlice';
import jiraSlice from './slices/jiraSlice';
import emailSlice from './slices/emailSlice';
import uiSlice from './slices/uiSlice';
import buildSlice from './slices/buildSlice';
import chatSlice from './slices/chatSlice';
import prSlice from './slices/prSlice';
import templateSlice from './slices/templateSlice';
import { jiraApi } from './api/jiraApi';
import { emailApi } from './api/emailApi';
import { buildApi } from './api/buildApi';
import { chatApi } from './api/chatApi';
import { prApi } from './api/prApi';
import { templateApi } from './api/templateApi';
import { environmentSettingsApi } from './api/environmentSettingsApi';

const store = configureStore({
  reducer: {
    app: appSlice,
    jira: jiraSlice,
    email: emailSlice,
    ui: uiSlice,
    build: buildSlice,
    chat: chatSlice,
    pr: prSlice,
    templates: templateSlice,
    [jiraApi.reducerPath]: jiraApi.reducer,
    [emailApi.reducerPath]: emailApi.reducer,
    [buildApi.reducerPath]: buildApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [prApi.reducerPath]: prApi.reducer,
    [templateApi.reducerPath]: templateApi.reducer,
    [environmentSettingsApi.reducerPath]: environmentSettingsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['jira/setImageFile'],
        ignoredPaths: ['jira.createJira.imageFile'],
      },
    }).concat(jiraApi.middleware, emailApi.middleware, buildApi.middleware, chatApi.middleware, prApi.middleware, templateApi.middleware, environmentSettingsApi.middleware),
});

// Export store for use in components
export { store };
export default store;
