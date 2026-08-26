import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ErrorBoundary from '../components/common/ErrorBoundary';
import LoadingFallback from '../components/common/LoadingFallback';
import PageSkeletonFallback from '../components/common/PageSkeletonFallback';
import {
  AiChatAssistant,
  AiDashboard,
  AiEmailComposer,
  ApiClient,
  CreateJiraContainer,
  GitStashContainer,
  HomeButtons,
  JiraIdPrompt,
  JiraViewerPage,
  PRContainer,
  ReleaseBuildContainer,
  SendEmailContainer,
  SettingsContainer,
} from './lazyComponents.ts';

const withLayout = (
  Component: React.ComponentType<any>,
  { fullWidth = false, title = 'Loading Module...' }: { fullWidth?: boolean; title?: string } = {}
): React.JSX.Element => (
  <Layout fullWidth={fullWidth}>
    <ErrorBoundary
      friendlyMessage={`Failed to load ${title.replace(/^Loading\s*/i, '').replace(/\.\.\.$/, '')}. Please check your connection or reload.`}
    >
      <Suspense fallback={<PageSkeletonFallback title={title} />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  </Layout>
);

const withFullScreen = (
  Component: React.ComponentType<any>,
  { message = 'Initializing...' }: { message?: string } = {}
): React.JSX.Element => (
  <ErrorBoundary
    fullScreen
    friendlyMessage={`Failed to initialize module (${message.replace(/^Initializing\s*|^Loading\s*/i, '').replace(/\.\.\.$/, '')}).`}
  >
    <Suspense fallback={<LoadingFallback message={message} />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Full-screen Jira Viewer Routes - Outside Layout */}
    <Route
      element={withFullScreen(JiraViewerPage, { message: 'Loading AI Jira Viewer...' })}
      path='/ai-view-jira/:id'
    />

    {/* Regular Layout Routes */}
    <Route
      element={withLayout(HomeButtons, { title: 'Loading Actions...' })}
      path='/'
    />
    <Route
      element={withLayout(CreateJiraContainer, { title: 'Loading AI Create Jira...' })}
      path='/ai-create-jira'
    />
    <Route
      element={withLayout(JiraIdPrompt, { title: 'Loading AI Jira Viewer...' })}
      path='/ai-view-jira'
    />
    <Route
      element={withLayout(AiEmailComposer, { title: 'Loading AI Email Composer...' })}
      path='/send-email'
    />
    <Route
      element={withLayout(SendEmailContainer, { title: 'Loading Email System...' })}
      path='/send-email-legacy'
    />
    <Route
      element={withLayout(ReleaseBuildContainer, { title: 'Loading Release Builder...' })}
      path='/release-build'
    />
    <Route
      element={withLayout(GitStashContainer, { fullWidth: true, title: 'Loading AI Code Review...' })}
      path='/ai-pr-code-review'
    />
    <Route
      element={withLayout(PRContainer, { title: 'Loading AI PR Generator...' })}
      path='/ai-generate-pr-template'
    />
    <Route
      element={withFullScreen(AiChatAssistant, { message: 'Initializing AI Chat Assistant...' })}
      path='/ai-chat-assistant'
    />
    <Route
      element={withFullScreen(ApiClient, { message: 'Initializing API Client...' })}
      path='/api-client'
    />
    <Route
      element={withLayout(SettingsContainer, { title: 'Loading Settings...' })}
      path='/settings'
    />
    <Route
      element={withFullScreen(AiDashboard, { message: 'Loading AI Manager Dashboard...' })}
      path='/ai-dashboard/*'
    />
  </Routes>
);

export default AppRoutes;
