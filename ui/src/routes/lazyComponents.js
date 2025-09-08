import { lazy } from 'react';

// Lazy load all route components for better performance
export const HomeButtons = lazy(() => import('../components/home/HomeButtons'));
export const CreateJiraContainer = lazy(
  () => import('../components/jira/CreateJira/CreateJiraContainer')
);
export const SendEmailContainer = lazy(() => import('../components/email/SendEmailContainer'));
export const AiEmailComposer = lazy(() => import('../components/email/AiEmailComposer'));
export const ReleaseBuildContainer = lazy(
  () => import('../components/build/ReleaseBuildContainer')
);
export const GitStashContainer = lazy(() => import('../components/gitstash/GitStashContainer'));
export const PRContainer = lazy(() => import('../components/pr/PRContainer'));
export const SettingsContainer = lazy(() => import('../components/settings/SettingsContainer'));
export const AiChatAssistant = lazy(() => import('../components/ai/AiChatAssistant'));
export const ApiClient = lazy(() => import('../components/api-client/ApiClient'));
export const JiraViewerPage = lazy(() => import('../components/jira/JiraViewer/JiraViewerPage'));
export const JiraIdPrompt = lazy(() => import('../components/jira/JiraViewer/JiraIdPrompt'));
export const Meeting = lazy(() => import('../components/meeting/Meeting'));
