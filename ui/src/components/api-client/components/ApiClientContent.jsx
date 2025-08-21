import React from 'react';
import ApiClientSidebar from '../ApiClientSidebar';
import ApiClientMainPanel from '../ApiClientMainPanel';
import ApiClientAiPanel from '../ApiClientAiPanel';

const ApiClientContent = ({ 
  apiClient, 
  collections, 
  environments, 
  uiState, 
  glassMorphismStyle 
}) => {
  return (
    <>
      <ApiClientSidebar
        activeEnvironment={environments.activeEnvironment}
        activeTab={uiState.activeTab}
        collections={collections.collections || []}
        environments={environments.environments || []}
        glassMorphismStyle={glassMorphismStyle}
        isCollapsed={uiState.leftSidebarCollapsed}
        setActiveTab={uiState.setActiveTab}
        onEnvironmentChange={environments.setActiveEnvironment}
        onEnvironmentDelete={environments.deleteEnvironment}
        onEnvironmentExport={environments.exportEnvironment}
        onEnvironmentImport={environments.importEnvironment}
        onEnvironmentSave={environments.saveEnvironment}
        onRequestSelect={apiClient.addCollectionRequest}
        onToggleCollapse={uiState.toggleLeftSidebar}
      />

      <ApiClientMainPanel
        activeEnvironment={environments.activeEnvironment}
        currentRequest={apiClient.currentRequest}
        environments={environments.environments || []}
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
    </>
  );
};

export default ApiClientContent;
