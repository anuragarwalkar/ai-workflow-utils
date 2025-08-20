import React from 'react';
import { Alert, Box } from '@mui/material';
import ApiClientHeader from '../ApiClientHeader';
import ApiClientContent from './ApiClientContent';

const ApiClientLayout = ({ 
  apiClient, 
  collections, 
  environments, 
  uiState, 
  glassMorphismStyle 
}) => {
  return (
    <>
      {apiClient.error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={apiClient.clearError}>
          {apiClient.error}
        </Alert>
      )}
      
      <ApiClientHeader
        activeEnvironment={environments.activeEnvironment}
        activeRequest={apiClient.activeRequestIndex}
        currentRequest={apiClient.currentRequest}
        environments={environments.environments || []}
        glassMorphismStyle={glassMorphismStyle}
        loading={apiClient.isExecuting}
        requests={apiClient.requests}
        setActiveRequest={apiClient.setActiveRequest}
        onAddRequest={apiClient.addRequest}
        onCloseRequest={apiClient.removeRequest}
        onSendRequest={apiClient.executeRequest}
        onUpdateRequest={apiClient.updateRequest}
      />

      <Box display="flex" height="calc(100vh - 140px)">
        <ApiClientContent
          apiClient={apiClient}
          collections={collections}
          environments={environments}
          glassMorphismStyle={glassMorphismStyle}
          uiState={uiState}
        />
      </Box>
    </>
  );
};

export default ApiClientLayout;
