import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from '../components/layout/Layout';
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
} from './lazyComponents';

/**
 * Helper to render a page inside Layout with in-layout Suspense fallback
 */
const withLayout = (Component, { fullWidth = false, title = 'Loading Module...' } = {}) => (
  <Layout fullWidth={fullWidth}>
    <Suspense fallback={<PageSkeletonFallback title={title} />}>
      <Component />
    </Suspense>
  </Layout>
);

/**
 * Helper to render a full-screen page with full-screen Suspense fallback
 */
const withFullScreen = (Component, { message = 'Initializing...' } = {}) => (
  <Suspense fallback={<LoadingFallback message={message} />}>
    <Component />
  </Suspense>
);

const AppRoutes = () => (
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
