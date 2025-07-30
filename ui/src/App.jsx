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
import ReleaseBuildContainer from './components/build/ReleaseBuildContainer';
import GitStashContainer from './components/gitstash/GitStashContainer';
import PRContainer from './components/pr/PRContainer';
import SettingsContainer from './components/settings/SettingsContainer';
import ViewJiraModal from './components/jira/ViewJira/ViewJiraModal';
import BuildModal from './components/build/BuildModal';
import NotificationSnackbar from './components/common/NotificationSnackbar';
import ChatOverlay from './components/chat/ChatOverlay';

const AppContent = () => (
  <>
    <Layout>
      <Routes>
        <Route path="/" element={<HomeButtons />} />
        <Route path="/ai-create-jira" element={<CreateJiraContainer />} />
        <Route path="/send-email" element={<SendEmailContainer />} />
        <Route path="/release-build" element={<ReleaseBuildContainer />} />
        <Route path="/ai-pr-review" element={<GitStashContainer />} />
      <Route path="/ai-generate-pr-template" element={<PRContainer />} />
        <Route path="/settings" element={<SettingsContainer />} />
      </Routes>
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
