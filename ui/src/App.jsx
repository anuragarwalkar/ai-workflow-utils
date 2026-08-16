import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import store from './store';
import { AppThemeProvider } from './theme/ThemeProvider';
import AppContent from './components/AppContent';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fullScreen friendlyMessage="AI Workflow Utils encountered a critical startup error.">
      <Provider store={store}>
        <BrowserRouter>
          <AppThemeProvider>
            <CssBaseline />
            <AppContent />
          </AppThemeProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
