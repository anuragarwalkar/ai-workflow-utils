import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import { initGlobalErrorHandlers } from './utils/initGlobalErrorHandlers';

initGlobalErrorHandlers();

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary fullScreen friendlyMessage="AI Workflow Utils encountered a critical startup error.">
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
