import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
  HomeButtons,
  CreateJiraContainer,
  SendEmailContainer,
  AiEmailComposer,
  ReleaseBuildContainer,
  GitStashContainer,
  PRContainer,
  SettingsContainer,
  AiDevAssistant,
  JiraViewerPage,
  JiraIdPrompt,
} from './lazyComponents';

const AppRoutes = () => (
  <Routes>
    {/* Full-screen Jira Viewer Routes - Outside Layout */}
    <Route path='/ai-view-jira/:id' element={<JiraViewerPage />} />

    {/* Regular Layout Routes */}
    <Route
      path='/'
      element={
        <Layout>
          <HomeButtons />
        </Layout>
      }
    />
    <Route
      path='/ai-create-jira'
      element={
        <Layout>
          <CreateJiraContainer />
        </Layout>
      }
    />
    <Route
      path='/ai-view-jira'
      element={
        <Layout>
          <JiraIdPrompt />
        </Layout>
      }
    />
    <Route
      path='/send-email'
      element={
        <Layout>
          <AiEmailComposer />
        </Layout>
      }
    />
    <Route
      path='/send-email-legacy'
      element={
        <Layout>
          <SendEmailContainer />
        </Layout>
      }
    />
    <Route
      path='/release-build'
      element={
        <Layout>
          <ReleaseBuildContainer />
        </Layout>
      }
    />
    <Route
      path='/ai-pr-code-review'
      element={
        <Layout>
          <GitStashContainer />
        </Layout>
      }
    />
    <Route
      path='/ai-generate-pr-template'
      element={
        <Layout>
          <PRContainer />
        </Layout>
      }
    />
    <Route
      path='/ai-dev-assistant'
      element={
        <Layout>
          <AiDevAssistant />
        </Layout>
      }
    />
    <Route
      path='/settings'
      element={
        <Layout>
          <SettingsContainer />
        </Layout>
      }
    />
  </Routes>
);

export default AppRoutes;
