import { Provider, useSelector } from 'react-redux';
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
import ViewJiraModal from './components/jira/ViewJira/ViewJiraModal';
import BuildModal from './components/build/BuildModal';
import NotificationSnackbar from './components/common/NotificationSnackbar';
import ChatOverlay from './components/chat/ChatOverlay';

const AppContent = () => {
  const currentView = useSelector((state) => state.app.currentView);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'createJira':
        return <CreateJiraContainer />;
      case 'sendEmail':
        return <SendEmailContainer />;
      case 'releaseBuild':
        return <ReleaseBuildContainer />;
      case 'gitStash':
        return <GitStashContainer />;
      case 'home':
      default:
        return <HomeButtons />;
    }
  };

  return (
    <>
      <Layout>
        {renderCurrentView()}
        <ViewJiraModal />
        <BuildModal />
        <NotificationSnackbar />
      </Layout>
      <ChatOverlay />
    </>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
