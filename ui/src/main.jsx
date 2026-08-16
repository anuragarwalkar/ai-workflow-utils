import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import { initGlobalErrorHandlers } from './utils/initGlobalErrorHandlers';

// Initialize global crash & chunk load error handlers
initGlobalErrorHandlers();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary fullScreen friendlyMessage="AI Workflow Utils encountered a critical startup error.">
      <App />
    </ErrorBoundary>
  </StrictMode>
);
