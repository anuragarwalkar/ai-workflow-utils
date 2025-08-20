import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useCreateEnvironmentMutation,
  useDeleteEnvironmentMutation,
  useExecuteRequestMutation,
  useGetActiveEnvironmentQuery,
  useGetEnvironmentsQuery,
  useImportEnvironmentMutation,
  useLazyExportEnvironmentQuery,
  useSetActiveEnvironmentMutation,
} from '../../../store/api/apiClientApi';
import {
  addCollectionRequest,
  addGeneratedRequest,
  addRequest,
  clearError,
  removeRequest,
  setActiveRequest,
  setCurrentResponse,
  setError,
  updateRequest,
} from '../../../store/slices/apiClientSlice';
import { validateRequest } from '../models/apiClientModels';

// Main API Client ViewModel Hook
export const useApiClientViewModel = () => {
  const dispatch = useDispatch();
  const state = useSelector((state) => state.apiClient);
  const apiHooks = useApiClientHooks();
  const requestActions = useRequestActions(dispatch, state.activeRequestIndex);
  const executionActions = useExecutionActions(dispatch, apiHooks.executeRequest);
  const environmentActions = useEnvironmentActions(apiHooks);
  
  return {
    // State
    requests: state.requests,
    currentRequest: state.requests[state.activeRequestIndex] || null,
    activeRequestIndex: state.activeRequestIndex,
    currentResponse: state.currentResponse,
    environments: apiHooks.environments,
    activeEnvironment: apiHooks.activeEnvironment,
    error: state.error,
    
    // Loading states
    isExecuting: apiHooks.isExecuting,
    environmentsLoading: apiHooks.environmentsLoading,
    activeEnvironmentLoading: apiHooks.activeEnvironmentLoading,
    
    // Actions
    ...requestActions,
    ...executionActions,
    ...environmentActions,
  };
};

// Separate hook for API calls
const useApiClientHooks = () => {
  const { data: environments = [], isLoading: environmentsLoading } = useGetEnvironmentsQuery();
  const { data: activeEnvironment, isLoading: activeEnvironmentLoading } = useGetActiveEnvironmentQuery();
  const [setActiveEnvironment] = useSetActiveEnvironmentMutation();
  const [createEnvironment] = useCreateEnvironmentMutation();
  const [deleteEnvironment] = useDeleteEnvironmentMutation();
  const [importEnvironment] = useImportEnvironmentMutation();
  const [exportEnvironment] = useLazyExportEnvironmentQuery();
  const [executeRequest, { isLoading: isExecuting }] = useExecuteRequestMutation();
  
  return {
    environments,
    activeEnvironment,
    environmentsLoading,
    activeEnvironmentLoading,
    setActiveEnvironment,
    createEnvironment,
    deleteEnvironment,
    importEnvironment,
    exportEnvironment,
    executeRequest,
    isExecuting,
  };
};

// Separate hook for request actions
const useRequestActions = (dispatch, activeRequestIndex) => {
  const handleAddRequest = useCallback(() => {
    dispatch(addRequest());
  }, [dispatch]);
  
  const handleUpdateRequest = useCallback((updates) => {
    dispatch(updateRequest({ index: activeRequestIndex, data: updates }));
  }, [dispatch, activeRequestIndex]);
  
  const handleRemoveRequest = useCallback((index) => {
    dispatch(removeRequest(index));
  }, [dispatch]);
  
  const handleSetActiveRequest = useCallback((index) => {
    dispatch(setActiveRequest(index));
  }, [dispatch]);
  
  const handleAddGeneratedRequest = useCallback((generatedRequest) => {
    dispatch(addGeneratedRequest(generatedRequest));
  }, [dispatch]);
  
  const handleAddCollectionRequest = useCallback((collectionRequest) => {
    dispatch(addCollectionRequest(collectionRequest));
  }, [dispatch]);
  
  return {
    addRequest: handleAddRequest,
    updateRequest: handleUpdateRequest,
    removeRequest: handleRemoveRequest,
    setActiveRequest: handleSetActiveRequest,
    addGeneratedRequest: handleAddGeneratedRequest,
    addCollectionRequest: handleAddCollectionRequest,
  };
};

// Separate hook for execution actions
const useExecutionActions = (dispatch, executeRequest) => {
  const handleExecuteRequest = useCallback(async (requestData) => {
    try {
      const validation = validateRequest(requestData);
      if (!validation.isValid) {
        dispatch(setError(validation.errors.join(', ')));
        return;
      }
      
      const result = await executeRequest(requestData).unwrap();
      dispatch(setCurrentResponse(result));
    } catch (err) {
      const errorResponse = {
        error: true,
        message: err.message || 'Request failed',
        status: err.status || 0,
      };
      dispatch(setCurrentResponse(errorResponse));
    }
  }, [dispatch, executeRequest]);
  
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  return {
    executeRequest: handleExecuteRequest,
    clearError: handleClearError,
  };
};

// Separate hook for environment actions
const useEnvironmentActions = (apiHooks) => {
  const handleSaveEnvironment = useCallback(async (environmentData) => {
    // Use create for new environments (no ID) or update for existing ones
    if (environmentData.id && environmentData.id.startsWith('env_')) {
      return await apiHooks.createEnvironment(environmentData).unwrap();
    } else {
      return await apiHooks.createEnvironment(environmentData).unwrap();
    }
  }, [apiHooks]);
  
  const handleDeleteEnvironment = useCallback(async (environmentId) => {
    return await apiHooks.deleteEnvironment(environmentId).unwrap();
  }, [apiHooks]);
  
  const handleImportEnvironment = useCallback(async (environmentData) => {
    return await apiHooks.importEnvironment(environmentData).unwrap();
  }, [apiHooks]);
  
  const handleExportEnvironment = useCallback(async (environmentId) => {
    const result = await apiHooks.exportEnvironment(environmentId);
    return result.data;
  }, [apiHooks]);
  
  const handleSetActiveEnvironment = useCallback(async (environmentOrId) => {
    // Handle both environment object and direct ID
    const id = typeof environmentOrId === 'string' ? environmentOrId : environmentOrId?.id;
    if (!id) {
      throw new Error('Environment ID is required');
    }
    return await apiHooks.setActiveEnvironment(id).unwrap();
  }, [apiHooks]);
  
  return {
    saveEnvironment: handleSaveEnvironment,
    deleteEnvironment: handleDeleteEnvironment,
    importEnvironment: handleImportEnvironment,
    exportEnvironment: handleExportEnvironment,
    setActiveEnvironment: handleSetActiveEnvironment,
  };
};
