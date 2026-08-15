import { lazy } from 'react';

/**
 * Enhanced lazy loader that attaches a `.preload()` method
 * to start fetching the component chunk on hover/focus before user clicks
 */
export const lazyWithPreload = (factory) => {
  const Component = lazy(factory);
  Component.preload = factory;
  return Component;
};

// Lazy load all top-level route components with preloading support
export const HomeButtons = lazyWithPreload(() => import('../components/home/HomeButtons'));
export const CreateJiraContainer = lazyWithPreload(
  () => import('../components/jira/CreateJira/CreateJiraContainer')
);
export const SendEmailContainer = lazyWithPreload(
  () => import('../components/email/SendEmailContainer')
);
export const AiEmailComposer = lazyWithPreload(
  () => import('../components/email/AiEmailComposer')
);
export const ReleaseBuildContainer = lazyWithPreload(
  () => import('../components/build/ReleaseBuildContainer')
);
export const GitStashContainer = lazyWithPreload(
  () => import('../components/gitstash/GitStashContainer')
);
export const PRContainer = lazyWithPreload(
  () => import('../components/pr/PRContainer')
);
export const SettingsContainer = lazyWithPreload(
  () => import('../components/settings/SettingsContainer')
);
export const AiChatAssistant = lazyWithPreload(
  () => import('../components/ai/AiChatAssistant')
);
export const ApiClient = lazyWithPreload(
  () => import('../components/api-client/ApiClient')
);
export const JiraViewerPage = lazyWithPreload(
  () => import('../components/jira/JiraViewer/JiraViewerPage')
);
export const JiraIdPrompt = lazyWithPreload(
  () => import('../components/jira/JiraViewer/JiraIdPrompt')
);
export const AiDashboard = lazyWithPreload(
  () => import('../components/dashboard/DashboardContainer')
);

// Lazy load Dashboard Sub-Routes with preloading support
export const DashboardOverviewPage = lazyWithPreload(
  () => import('../components/dashboard/OverviewPage')
);
export const DashboardNotesPage = lazyWithPreload(
  () => import('../components/dashboard/notes/NotesPage')
);
export const DashboardVectorDbPage = lazyWithPreload(
  () => import('../components/dashboard/VectorDbPage')
);
export const DashboardManagePage = lazyWithPreload(
  () => import('../components/dashboard/ManagePage')
);

// Map paths to component preloader functions for smart prefetching
const routePreloadMap = {
  '/': HomeButtons,
  '/ai-create-jira': CreateJiraContainer,
  '/ai-view-jira': JiraIdPrompt,
  '/ai-view-jira/:id': JiraViewerPage,
  '/send-email': AiEmailComposer,
  '/send-email-legacy': SendEmailContainer,
  '/release-build': ReleaseBuildContainer,
  '/ai-pr-code-review': GitStashContainer,
  '/ai-generate-pr-template': PRContainer,
  '/ai-chat-assistant': AiChatAssistant,
  '/api-client': ApiClient,
  '/settings': SettingsContainer,
  '/ai-dashboard': AiDashboard,
  '/ai-dashboard/notes': DashboardNotesPage,
  '/ai-dashboard/vector-db': DashboardVectorDbPage,
  '/ai-dashboard/knowledge-base': DashboardVectorDbPage,
  '/ai-dashboard/manage': DashboardManagePage,
};

/**
 * Preload a route component by path string or component reference
 * @param {string | Function} target - Route path or lazy component
 */
export const preloadRoute = (target) => {
  try {
    if (typeof target === 'string') {
      const component = routePreloadMap[target] || routePreloadMap[target.replace(/\/$/, '')];
      if (component && typeof component.preload === 'function') {
        component.preload();
      }
    } else if (target && typeof target.preload === 'function') {
      target.preload();
    }
  } catch {
    // Ignore preloading errors in background
  }
};
