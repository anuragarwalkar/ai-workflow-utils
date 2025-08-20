import React from 'react';
import { Alert, Box, alpha, useTheme } from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';
import { useApiClientViewModel } from './viewModels/useApiClientViewModel';
import { useUiStateViewModel } from './viewModels/useUiStateViewModel';
import ApiClientHeader from './ApiClientHeader';
import ApiClientSidebar from './ApiClientSidebar';
import ApiClientMainPanel from './ApiClientMainPanel';
import ApiClientAiPanel from './ApiClientAiPanel';

const ApiClient = () => {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  
  // ViewModels
  const apiClient = useApiClientViewModel();
  const uiState = useUiStateViewModel();
  
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
      {apiClient.error ? (
        <Alert severity="error" sx={{ mb: 1 }} onClose={apiClient.clearError}>
          {apiClient.error}
        </Alert>
      ) : null}
      
      <ApiClientHeader
        activeEnvironment={apiClient.activeEnvironment}
        activeRequest={apiClient.activeRequestIndex}
        currentRequest={apiClient.currentRequest}
        environments={apiClient.environments}
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
        <ApiClientSidebar
          activeEnvironment={apiClient.activeEnvironment}
          activeTab={uiState.activeTab}
          environments={apiClient.environments}
          glassMorphismStyle={glassMorphismStyle}
          isCollapsed={uiState.leftSidebarCollapsed}
          setActiveTab={uiState.setActiveTab}
          onEnvironmentChange={apiClient.setActiveEnvironment}
          onEnvironmentSave={apiClient.saveEnvironment}
          onEnvironmentDelete={apiClient.deleteEnvironment}
          onEnvironmentExport={apiClient.exportEnvironment}
          onEnvironmentImport={apiClient.importEnvironment}
          onRequestSelect={apiClient.addCollectionRequest}
          onToggleCollapse={uiState.toggleLeftSidebar}
        />

        <ApiClientMainPanel
          activeEnvironment={apiClient.activeEnvironment}
          currentRequest={apiClient.currentRequest}
          environments={apiClient.environments}
          glassMorphismStyle={glassMorphismStyle}
          loading={apiClient.isExecuting}
          response={apiClient.currentResponse}
          onUpdate={apiClient.updateRequest}
        />

        <ApiClientAiPanel 
          glassMorphismStyle={glassMorphismStyle}
          isCollapsed={uiState.rightSidebarCollapsed}
          onApiRequestGenerated={apiClient.addGeneratedRequest}
          onToggleCollapse={uiState.toggleRightSidebar}
        />
      </Box>
    </Box>
  );
};

export default ApiClient;
