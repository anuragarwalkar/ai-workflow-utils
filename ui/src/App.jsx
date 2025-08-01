import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import store from './store';
import theme from './theme/theme';
import Layout from './components/layout/Layout';
import HomeButtons from './components/home/HomeButtons';
import CreateJiraContainer from './components/jira/CreateJira/CreateJiraContainer';
import SendEmailContainer from './components/email/SendEmailContainer';
import AiEmailComposer from './components/email/AiEmailComposer';
import ReleaseBuildContainer from './components/build/ReleaseBuildContainer';
import GitStashContainer from './components/gitstash/GitStashContainer';
import PRContainer from './components/pr/PRContainer';
import SettingsContainer from './components/settings/SettingsContainer';
import ViewJiraModal from './components/jira/ViewJira/ViewJiraModal';
import BuildModal from './components/build/BuildModal';
import NotificationSnackbar from './components/common/NotificationSnackbar';
import ChatOverlay from './components/chat/ChatOverlay';
import AiDevAssistant from './components/ai/AiDevAssistant';
import { Suspense, lazy } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Lazy load the Jira Viewer page
const JiraViewerPage = lazy(() => import('./components/jira/JiraViewer/JiraViewerPage'));
const JiraIdPrompt = lazy(() => import('./components/jira/JiraViewer/JiraIdPrompt'));

const AppContent = () => (
  <>
    <Layout>
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      }>
        <Routes>
          <Route path="/" element={<HomeButtons />} />
          <Route path="/ai-create-jira" element={<CreateJiraContainer />} />
          <Route path="/ai-view-jira" element={<JiraIdPrompt />} />
          <Route path="/ai-view-jira/:id" element={<JiraViewerPage />} />
          <Route path="/send-email" element={<AiEmailComposer />} />
          <Route path="/send-email-legacy" element={<SendEmailContainer />} />
          <Route path="/release-build" element={<ReleaseBuildContainer />} />
          <Route path="/ai-pr-code-review" element={<GitStashContainer />} />
          <Route path="/ai-generate-pr-template" element={<PRContainer />} />
          <Route path="/ai-dev-assistant" element={<AiDevAssistant />} />
          <Route path="/settings" element={<SettingsContainer />} />
        </Routes>
      </Suspense>
      <ViewJiraModal />
      <BuildModal />
      <NotificationSnackbar />
    </Layout>
    <ChatOverlay />
  </>
);


function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppContent />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
