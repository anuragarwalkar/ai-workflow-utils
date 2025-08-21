import React from 'react';
import { useLocation } from 'react-router-dom';
import ChatOverlay from './ChatOverlay';

// Component to conditionally render ChatOverlay
const ConditionalChatOverlay = () => {
  const location = useLocation();
  const isJiraViewer = location.pathname.startsWith('/ai-view-jira');
  const isApiClient = location.pathname.startsWith('/api-client');

  // Don't render global chat overlay on Jira viewer pages
  if (isJiraViewer || isApiClient) {
    return null;
  }

  return <ChatOverlay />;
};

export default ConditionalChatOverlay;
