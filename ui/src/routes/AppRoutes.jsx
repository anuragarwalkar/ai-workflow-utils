import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
  AiChatAssistant,
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
  ToolsDemo,
} from './lazyComponents';

const AppRoutes = () => (
  <Routes>
    {/* Full-screen Jira Viewer Routes - Outside Layout */}
    <Route element={<JiraViewerPage />} path='/ai-view-jira/:id' />

    {/* Regular Layout Routes */}
    <Route
      element={
        <Layout>
          <HomeButtons />
        </Layout>
      }
      path='/'
    />
    <Route
      element={
        <Layout>
          <CreateJiraContainer />
        </Layout>
      }
      path='/ai-create-jira'
    />
    <Route
      element={
        <Layout>
          <JiraIdPrompt />
        </Layout>
      }
      path='/ai-view-jira'
    />
    <Route
      element={
        <Layout>
          <AiEmailComposer />
        </Layout>
      }
      path='/send-email'
    />
    <Route
      element={
        <Layout>
          <SendEmailContainer />
        </Layout>
      }
      path='/send-email-legacy'
    />
    <Route
      element={
        <Layout>
          <ReleaseBuildContainer />
        </Layout>
      }
      path='/release-build'
    />
    <Route
      element={
        <Layout>
          <GitStashContainer />
        </Layout>
      }
      path='/ai-pr-code-review'
    />
    <Route
      element={
        <Layout>
          <PRContainer />
        </Layout>
      }
      path='/ai-generate-pr-template'
    />
    <Route
      element={
        <Layout>
          <AiChatAssistant />
        </Layout>
      }
      path='/ai-chat-assistant'
    />
    <Route
      element={
        <Layout>
          <ToolsDemo />
        </Layout>
      }
      path='/tools-demo'
    />
    <Route
      element={<ApiClient />}
      path='/api-client'
    />
    <Route
      element={
        <Layout>
          <SettingsContainer />
        </Layout>
      }
      path='/settings'
    />
  </Routes>
);

export default AppRoutes;
