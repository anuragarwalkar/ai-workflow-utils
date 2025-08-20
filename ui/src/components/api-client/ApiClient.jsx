/* eslint-disable max-lines */
/* eslint-disable max-statements */
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';
import { useEnvironments } from '../../hooks/useEnvironments';
import { useCollections } from '../../hooks/useCollections';
import ApiClientHeader from './ApiClientHeader';
import ApiClientSidebar from './ApiClientSidebar';
import ApiClientMainPanel from './ApiClientMainPanel';
import ApiClientAiPanel from './ApiClientAiPanel';
import { API_BASE_URL } from '../../config/environment.js';

const ApiClient = () => {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  
  // Environment management
  const {
    environments,
    activeEnvironment,
    error: envError,
    saveEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    exportEnvironment,
    importEnvironment,
    clearError,
  } = useEnvironments();

  // Collections management
  const {
    collections,
  } = useCollections();
  
  const [activeTab, setActiveTab] = useState(0);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [requests, setRequests] = useState([
    {
      id: 1,
      name: 'New Request',
      method: 'GET',
      url: '',
      headers: {},
      params: {},
      body: '',
      bodyType: 'json',
      auth: {
        type: 'none',
        token: '',
        username: '',
        password: '',
        apiKey: '',
        apiKeyHeader: 'X-API-Key',
      }
    }
  ]);
  const [activeRequest, setActiveRequest] = useState(0);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEnvironmentChange = async (environment) => {
    try {
      await setActiveEnvironment(environment.id);
    } catch {
      // Error handling is managed by the hook
    }
  };

  const handleSendRequest = useCallback(async (requestData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/api-client/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      setResponse(result);
    } catch (error) {
      setResponse({
        error: true,
        message: error.message,
        status: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApiRequestGenerated = useCallback((generatedRequest) => {
    // Create a better name from the request data
    const createRequestName = (request) => {
      const method = request.method || 'GET';
      const url = request.url || '';
      
      // Extract meaningful parts from URL for the name
      if (url) {
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(part => part && part !== 'api');
          
          if (pathParts.length > 0) {
            const resource = pathParts[pathParts.length - 1];
            return `${method} ${resource}`;
          }
        } catch {
          // If URL parsing fails, extract domain
          const match = url.match(/https?:\/\/([^/]+)/);
          if (match) {
            return `${method} ${match[1]}`;
          }
        }
      }
      
      // Fallback to description or generic name
      if (request.description && request.description.length < 30) {
        return request.description;
      }
      
      return `${method} Request ${requests.length + 1}`;
    };

    // Create a new request with the generated data
    const newRequest = {
      id: Date.now(),
      name: createRequestName(generatedRequest),
      method: generatedRequest.method || 'GET',
      url: generatedRequest.url || '',
      headers: generatedRequest.headers || {},
      params: generatedRequest.params || {},
      body: generatedRequest.body ? JSON.stringify(generatedRequest.body, null, 2) : '',
      bodyType: generatedRequest.bodyType || 'json',
      auth: generatedRequest.auth || {
        type: 'none',
        token: '',
        username: '',
        password: '',
        apiKey: '',
        apiKeyHeader: 'X-API-Key',
      }
    };

    // Add the request to the list and make it active
    setRequests(prev => [...prev, newRequest]);
    setActiveRequest(requests.length); // Set to the new request index
  }, [requests.length]);

  const handleUpdateRequest = useCallback((updatedRequest) => {
    setRequests(prev => 
      prev.map((req, index) => 
        index === activeRequest ? { ...req, ...updatedRequest } : req
      )
    );
  }, [activeRequest]);

  const handleAddRequest = () => {
    const newRequest = {
      id: Date.now(),
      name: `Request ${requests.length + 1}`,
      method: 'GET',
      url: '',
      headers: {},
      params: {},
      body: '',
      bodyType: 'json',
      auth: {
        type: 'none',
        token: '',
        username: '',
        password: '',
        apiKey: '',
        apiKeyHeader: 'X-API-Key',
      }
    };
    setRequests(prev => [...prev, newRequest]);
    setActiveRequest(requests.length);
  };

  const handleCloseRequest = (index) => {
    if (requests.length <= 1) return; // Don't close if it's the only request
    
    const newRequests = requests.filter((_, i) => i !== index);
    setRequests(newRequests);
    
    // Adjust active request index
    if (index === activeRequest) {
      // If closing active request, switch to previous or first
      setActiveRequest(index > 0 ? index - 1 : 0);
    } else if (index < activeRequest) {
      // If closing request before active, decrease active index
      setActiveRequest(activeRequest - 1);
    }
    // If closing request after active, no change needed
  };

  const handleRequestFromCollection = useCallback((collectionRequest) => {
    // Convert collection request format to our internal request format
    const newRequest = {
      id: Date.now(),
      name: collectionRequest.name || 'Collection Request',
      method: collectionRequest.method || 'GET',
      url: collectionRequest.url || '',
      headers: collectionRequest.headers || {},
      params: collectionRequest.params || {},
      body: collectionRequest.body || '',
      bodyType: collectionRequest.bodyType || 'json',
      auth: collectionRequest.auth || {
        type: 'none',
        token: '',
        username: '',
        password: '',
        apiKey: '',
        apiKeyHeader: 'X-API-Key',
      }
    };

    // Add as a new request
    setRequests(prev => [...prev, newRequest]);
    setActiveRequest(requests.length); // Switch to the new request
  }, [requests.length]);

  const glassMorphismStyle = {
    background: isDark 
      ? '#1E1E1E'
      : alpha(theme.palette.background.paper, 0.9),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.1 : 0.1)}`,
  };

  return (
    <Box
      sx={{
        height: '100vh',
        background: isDark
          ? '#1E1E1E'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        overflow: 'hidden',
      }}
    >
      {envError ? (
        <Alert severity="error" sx={{ mb: 1 }} onClose={clearError}>
          {envError}
        </Alert>
      ) : null}
      
      <ApiClientHeader
        activeEnvironment={activeEnvironment}
        activeRequest={activeRequest}
        currentRequest={requests[activeRequest]}
        environments={environments}
        glassMorphismStyle={glassMorphismStyle}
        loading={loading}
        requests={requests}
        setActiveRequest={setActiveRequest}
        onAddRequest={handleAddRequest}
        onCloseRequest={handleCloseRequest}
        onSendRequest={handleSendRequest}
        onUpdateRequest={handleUpdateRequest}
      />

      <Box display="flex" height="calc(100vh - 140px)">
        <ApiClientSidebar
          activeEnvironment={activeEnvironment}
          activeTab={activeTab}
          collections={collections}
          environments={environments}
          glassMorphismStyle={glassMorphismStyle}
          isCollapsed={leftSidebarCollapsed}
          setActiveTab={setActiveTab}
          onEnvironmentChange={handleEnvironmentChange}
          onEnvironmentDelete={deleteEnvironment}
          onEnvironmentExport={exportEnvironment}
          onEnvironmentImport={importEnvironment}
          onEnvironmentSave={saveEnvironment}
          onRequestSelect={handleRequestFromCollection}
          onToggleCollapse={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
        />

        <ApiClientMainPanel
          activeEnvironment={activeEnvironment}
          currentRequest={requests[activeRequest]}
          environments={environments}
          glassMorphismStyle={glassMorphismStyle}
          loading={loading}
          response={response}
          onUpdate={handleUpdateRequest}
        />

        <ApiClientAiPanel 
          glassMorphismStyle={glassMorphismStyle}
          isCollapsed={rightSidebarCollapsed}
          onApiRequestGenerated={handleApiRequestGenerated}
          onToggleCollapse={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
        />
      </Box>
    </Box>
  );
};

export default ApiClient;
