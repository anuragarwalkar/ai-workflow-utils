import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useGetCollectionsQuery,
  useImportCollectionMutation,
  useLazyExportCollectionQuery,
  useUpdateCollectionMutation,
} from '../../../store/api/apiClientApi';
import { setError } from '../../../store/slices/apiClientSlice';
import { validateCollection } from '../models/apiClientModels';

// Collections ViewModel Hook
export const useCollectionsViewModel = () => {
  const dispatch = useDispatch();
  
  // API queries and mutations
  const { data: collections = [], isLoading, error, refetch } = useGetCollectionsQuery();
  const [createCollection, { isLoading: isCreating }] = useCreateCollectionMutation();
  const [updateCollection, { isLoading: isUpdating }] = useUpdateCollectionMutation();
  const [deleteCollection, { isLoading: isDeleting }] = useDeleteCollectionMutation();
  const [importCollection, { isLoading: isImporting }] = useImportCollectionMutation();
  const [exportCollection] = useLazyExportCollectionQuery();
  
  const actions = useCollectionActions(dispatch, {
    createCollection,
    updateCollection,
    deleteCollection,
    importCollection,
    exportCollection,
  });
  
  return {
    // State
    collections,
    error,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isImporting,
    
    // Actions
    ...actions,
    refetch,
  };
};

// Separate hook for collection actions
const useCollectionActions = (dispatch, mutations) => {
  const {
    createCollection,
    updateCollection,
    deleteCollection,
    importCollection,
    exportCollection,
  } = mutations;
  
  const handleCreateCollection = useCallback(async (collectionData) => {
    try {
      const validation = validateCollection(collectionData);
      if (!validation.isValid) {
        dispatch(setError(validation.errors.join(', ')));
        return null;
      }
      
      return await createCollection(collectionData).unwrap();
    } catch (err) {
      dispatch(setError(err.message || 'Failed to create collection'));
      throw err;
    }
  }, [createCollection, dispatch]);
  
  const handleUpdateCollection = useCallback(async (id, updates) => {
    try {
      const validation = validateCollection(updates);
      if (!validation.isValid) {
        dispatch(setError(validation.errors.join(', ')));
        return null;
      }
      
      return await updateCollection({ id, ...updates }).unwrap();
    } catch (err) {
      dispatch(setError(err.message || 'Failed to update collection'));
      throw err;
    }
  }, [updateCollection, dispatch]);
  
  const handleDeleteCollection = useCallback(async (id) => {
    try {
      await deleteCollection(id).unwrap();
    } catch (err) {
      dispatch(setError(err.message || 'Failed to delete collection'));
      throw err;
    }
  }, [deleteCollection, dispatch]);
  
  const handleImportCollection = useCallback(async (collectionData) => {
    try {
      return await importCollection(collectionData).unwrap();
    } catch (err) {
      dispatch(setError(err.message || 'Failed to import collection'));
      throw err;
    }
  }, [importCollection, dispatch]);
  
  const handleExportCollection = useCallback(async (id) => {
    try {
      return await exportCollection(id).unwrap();
    } catch (err) {
      dispatch(setError(err.message || 'Failed to export collection'));
      throw err;
    }
  }, [exportCollection, dispatch]);
  
  return {
    createCollection: handleCreateCollection,
    updateCollection: handleUpdateCollection,
    deleteCollection: handleDeleteCollection,
    importCollection: handleImportCollection,
    exportCollection: handleExportCollection,
  };
};
