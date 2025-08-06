import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import store from './store';
import { AppThemeProvider } from './theme/ThemeProvider';
import AppContent from './components/AppContent';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppThemeProvider>
          <CssBaseline />
          <AppContent />
        </AppThemeProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
