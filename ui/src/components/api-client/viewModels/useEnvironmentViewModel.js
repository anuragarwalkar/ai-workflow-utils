import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  useCreateEnvironmentMutation,
  useDeleteEnvironmentMutation,
  useGetActiveEnvironmentQuery,
  useGetEnvironmentsQuery,
  useImportEnvironmentMutation,
  useLazyExportEnvironmentQuery,
  useSetActiveEnvironmentMutation,
  useUpdateEnvironmentMutation,
} from '../../../store/api/apiClientApi';
import { setError } from '../../../store/slices/apiClientSlice';
import { validateEnvironment } from '../models/apiClientModels';

// Environment ViewModel Hook
export const useEnvironmentViewModel = () => {
  const dispatch = useDispatch();
  
  // API queries and mutations
  const { data: environments = [], isLoading, error, refetch } = useGetEnvironmentsQuery();
  const { data: activeEnvironment, isLoading: activeLoading } = useGetActiveEnvironmentQuery();
  const [createEnvironment, { isLoading: isCreating }] = useCreateEnvironmentMutation();
  const [updateEnvironment, { isLoading: isUpdating }] = useUpdateEnvironmentMutation();
  const [deleteEnvironment, { isLoading: isDeleting }] = useDeleteEnvironmentMutation();
  const [setActiveEnvironment, { isLoading: isSettingActive }] = useSetActiveEnvironmentMutation();
  const [importEnvironment, { isLoading: isImporting }] = useImportEnvironmentMutation();
  const [exportEnvironment] = useLazyExportEnvironmentQuery();
  
  const actions = useEnvironmentActions(dispatch, {
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    importEnvironment,
    exportEnvironment,
  });
  
  return {
    // State
    environments,
    activeEnvironment,
    error,
    
    // Loading states
    isLoading,
    activeLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isSettingActive,
    isImporting,
    
    // Actions
    ...actions,
    refetch,
  };
};

// Separate hook for environment actions
const useEnvironmentActions = (dispatch, mutations) => {
  const {
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    importEnvironment,
    exportEnvironment,
  } = mutations;
  
  const handleCreateEnvironment = useCallback(async (environmentData) => {
    try {
      const validation = validateEnvironment(environmentData);
      if (!validation.isValid) {
        dispatch(setError(validation.errors.join(', ')));
        return null;
      }
      
      return await createEnvironment(environmentData).unwrap();
    } catch (err) {
      dispatch(setError(err.message || 'Failed to create environment'));
      throw err;
    }
  }, [createEnvironment, dispatch]);
  
  const handleUpdateEnvironment = useCallback(async (id, updates) => {
    try {
      const validation = validateEnvironment(updates);
      if (!validation.isValid) {
        dispatch(setError(validation.errors.join(', ')));
        return null;
      }
      
      return await updateEnvironment({ id, ...updates }).unwrap();
    } catch (err) {
      dispatch(setError(err.message || 'Failed to update environment'));
      throw err;
    }
  }, [updateEnvironment, dispatch]);
  
  const handleDeleteEnvironment = useCallback(async (id) => {
    try {
      await deleteEnvironment(id).unwrap();
    } catch (err) {
      dispatch(setError(err.message || 'Failed to delete environment'));
      throw err;
    }
  }, [deleteEnvironment, dispatch]);
  
  const handleSetActiveEnvironment = useCallback(async (id) => {
    try {
      await setActiveEnvironment(id).unwrap();
    } catch (err) {
      dispatch(setError(err.message || 'Failed to set active environment'));
      throw err;
    }
  }, [setActiveEnvironment, dispatch]);
  
  const handleImportEnvironment = useCallback(async (environmentData) => {
    try {
      return await importEnvironment(environmentData).unwrap();
    } catch (err) {
      dispatch(setError(err.message || 'Failed to import environment'));
      throw err;
    }
  }, [importEnvironment, dispatch]);
  
  const handleExportEnvironment = useCallback(async (id) => {
    try {
      return await exportEnvironment(id).unwrap();
    } catch (err) {
      dispatch(setError(err.message || 'Failed to export environment'));
      throw err;
    }
  }, [exportEnvironment, dispatch]);

  const handleSaveEnvironment = useCallback(async (environmentData) => {
    try {
      // If environment has an ID and exists, update it; otherwise create new
      if (environmentData.id) {
        return await handleUpdateEnvironment(environmentData.id, environmentData);
      } else {
        return await handleCreateEnvironment(environmentData);
      }
    } catch (err) {
      dispatch(setError(err.message || 'Failed to save environment'));
      throw err;
    }
  }, [handleCreateEnvironment, handleUpdateEnvironment, dispatch]);

  return {
    createEnvironment: handleCreateEnvironment,
    updateEnvironment: handleUpdateEnvironment,
    deleteEnvironment: handleDeleteEnvironment,
    setActiveEnvironment: handleSetActiveEnvironment,
    importEnvironment: handleImportEnvironment,
    exportEnvironment: handleExportEnvironment,
    saveEnvironment: handleSaveEnvironment,
  };
};
