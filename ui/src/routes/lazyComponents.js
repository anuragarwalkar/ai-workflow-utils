import { lazyWithPreload } from '../utils/lazyWithRetry.js';

// Lazy load all top-level route components with preloading & auto-retry support
export const HomeButtons = lazyWithPreload(
  () => import('../components/home/HomeButtons'),
  'HomeButtons'
);

export const CreateJiraContainer = lazyWithPreload(
  () => import('../components/jira/CreateJira/CreateJiraContainer'),
  'CreateJiraContainer'
);

export const SendEmailContainer = lazyWithPreload(
  () => import('../components/email/SendEmailContainer'),
  'SendEmailContainer'
);

export const AiEmailComposer = lazyWithPreload(
  () => import('../components/email/AiEmailComposer'),
  'AiEmailComposer'
);

export const ReleaseBuildContainer = lazyWithPreload(
  () => import('../components/build/ReleaseBuildContainer'),
  'ReleaseBuildContainer'
);

export const GitStashContainer = lazyWithPreload(
  () => import('../components/gitstash/GitStashContainer'),
  'GitStashContainer'
);

export const PRContainer = lazyWithPreload(
  () => import('../components/pr/PRContainer'),
  'PRContainer'
);

export const SettingsContainer = lazyWithPreload(
  () => import('../components/settings/SettingsContainer'),
  'SettingsContainer'
);

export const AiChatAssistant = lazyWithPreload(
  () => import('../components/ai/AiChatAssistant'),
  'AiChatAssistant'
);

export const ApiClient = lazyWithPreload(
  () => import('../components/api-client/ApiClient'),
  'ApiClient'
);

export const JiraViewerPage = lazyWithPreload(
  () => import('../components/jira/JiraViewer/JiraViewerPage'),
  'JiraViewerPage'
);

export const JiraIdPrompt = lazyWithPreload(
  () => import('../components/jira/JiraViewer/JiraIdPrompt'),
  'JiraIdPrompt'
);

export const AiDashboard = lazyWithPreload(
  () => import('../components/dashboard/DashboardContainer'),
  'AiDashboard'
);

// Lazy load Dashboard Sub-Routes with preloading & auto-retry support
export const DashboardOverviewPage = lazyWithPreload(
  () => import('../components/dashboard/OverviewPage'),
  'DashboardOverviewPage'
);

export const DashboardNotesPage = lazyWithPreload(
  () => import('../components/dashboard/notes/NotesPage'),
  'DashboardNotesPage'
);

export const DashboardVectorDbPage = lazyWithPreload(
  () => import('../components/dashboard/VectorDbPage'),
  'DashboardVectorDbPage'
);

export const DashboardManagePage = lazyWithPreload(
  () => import('../components/dashboard/ManagePage'),
  'DashboardManagePage'
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
 * Preload a route component safely by path string or component reference
 * @param {string | Function} target - Route path or lazy component
 */
export const preloadRoute = (target) => {
  try {
    if (typeof target === 'string') {
      const component = routePreloadMap[target] || routePreloadMap[target.replace(/\/$/, '')];
      if (component && typeof component.preload === 'function') {
        Promise.resolve(component.preload()).catch(() => {});
      }
    } else if (target && typeof target.preload === 'function') {
      Promise.resolve(target.preload()).catch(() => {});
    }
  } catch {
    // Ignore preloading errors in background
  }
};

export { lazyWithPreload };
