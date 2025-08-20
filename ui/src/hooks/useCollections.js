import { useCallback, useEffect, useState } from 'react';
import CollectionsApiService from '../services/collectionsApiService';

// Custom hook for managing API client collections
export const useCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all collections
  const loadCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await CollectionsApiService.getCollections();
      const collectionsData = response.data || [];

      setCollections(collectionsData);
    } catch (err) {
      const errorMessage = err.message || 'Failed to load collections';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new collection
  const createCollection = useCallback(async (collectionData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await CollectionsApiService.createCollection(collectionData);
      const newCollection = response.data;

      setCollections(prev => [...prev, newCollection]);
      return newCollection;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create collection';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a collection
  const updateCollection = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      setError(null);

      const response = await CollectionsApiService.updateCollection(id, updates);
      const updatedCollection = response.data;

      setCollections(prev => 
        prev.map(collection => 
          collection.id === id ? { ...collection, ...updatedCollection } : collection
        )
      );
      return updatedCollection;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update collection';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a collection
  const deleteCollection = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await CollectionsApiService.deleteCollection(id);

      setCollections(prev => prev.filter(collection => collection.id !== id));
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete collection';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Import a collection
  const importCollection = useCallback(async (collectionData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await CollectionsApiService.importCollection(collectionData);
      const importedCollection = response.data;

      setCollections(prev => [...prev, importedCollection]);
      return importedCollection;
    } catch (err) {
      const errorMessage = err.message || 'Failed to import collection';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Export a collection
  const exportCollection = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await CollectionsApiService.exportCollection(id);
      return response.data || response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to export collection';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Export all collections
  const exportAllCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await CollectionsApiService.exportAllCollections();
      return response.data || response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to export all collections';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  return {
    collections,
    loading,
    error,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    importCollection,
    exportCollection,
    exportAllCollections,
    clearError,
  };
};
