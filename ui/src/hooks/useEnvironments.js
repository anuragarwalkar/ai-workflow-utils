/* eslint-disable max-statements */
import { useCallback, useEffect, useState } from 'react';
import EnvironmentApiService from '../services/environmentApiService';

// Custom hook for managing API client environments
export const useEnvironments = () => {
  const [environments, setEnvironments] = useState([]);
  const [activeEnvironment, setActiveEnvironment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Normalize environment data from backend format to frontend format
  const normalizeEnvironment = useCallback(env => {
    if (!env) return null;
    
    // Convert API Client format (values array) to object format (variables object)
    if (env.values && Array.isArray(env.values)) {
      const variables = {};
      env.values.forEach(item => {
        if (item.key) {
          variables[item.key] = item.value || '';
        }
      });
      return { ...env, variables };
    }
    
    return env;
  }, []);

  const normalizeEnvironments = useCallback(envs => {
    if (!Array.isArray(envs)) return [];
    return envs.map(normalizeEnvironment);
  }, [normalizeEnvironment]);

  // Load all environments
  const loadEnvironments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [environmentsResponse, activeResponse] = await Promise.all([
        EnvironmentApiService.getEnvironments(),
        EnvironmentApiService.getActiveEnvironment().catch(() => ({ data: null })),
      ]);

      const rawEnvironments = environmentsResponse.data?.environments || [];
      const rawActiveEnvironment = activeResponse.data;

      setEnvironments(normalizeEnvironments(rawEnvironments));
      setActiveEnvironment(normalizeEnvironment(rawActiveEnvironment));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [normalizeEnvironment, normalizeEnvironments]);

  // Create new environment
  const createEnvironment = useCallback(
    async environmentData => {
      try {
        setLoading(true);
        setError(null);

        const validation = EnvironmentApiService.validateEnvironment(environmentData);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }

        const response = await EnvironmentApiService.createEnvironment(environmentData);
        await loadEnvironments(); // Refresh list

        return response;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadEnvironments]
  );

  // Update existing environment
  const updateEnvironment = useCallback(
    async (id, environmentData) => {
      try {
        setLoading(true);
        setError(null);

        const validation = EnvironmentApiService.validateEnvironment(environmentData);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }

        const response = await EnvironmentApiService.updateEnvironment(id, environmentData);
        await loadEnvironments(); // Refresh list

        return response;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadEnvironments]
  );

  // Delete environment
  const deleteEnvironment = useCallback(
    async id => {
      try {
        setLoading(true);
        setError(null);

        await EnvironmentApiService.deleteEnvironment(id);

        // If deleted environment was active, clear active environment
        if (activeEnvironment && activeEnvironment.id === id) {
          setActiveEnvironment(null);
        }

        await loadEnvironments(); // Refresh list
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [activeEnvironment, loadEnvironments]
  );

  // Set active environment
  const setActiveEnvironmentById = useCallback(
    async id => {
      try {
        setLoading(true);
        setError(null);

        const response = await EnvironmentApiService.setActiveEnvironment(id);
        const selectedEnv = environments.find(env => env.id === id);

        setActiveEnvironment(selectedEnv || null);
        return response;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [environments]
  );

  // Export environment
  const exportEnvironment = useCallback(
    async id => {
      try {
        setError(null);
        const response = await EnvironmentApiService.exportEnvironment(id);

        // Convert to API Client format for better compatibility
        const environment = environments.find(env => env.id === id);
        if (environment) {
          return EnvironmentApiService.toApiClientFormat(environment);
        }

        return response.data;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [environments]
  );

  // Export all environments
  const exportAllEnvironments = useCallback(async () => {
    try {
      setError(null);
      // Convert all to API Client format
      return environments.map(env => EnvironmentApiService.toApiClientFormat(env));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [environments]);

  // Import environment
  const importEnvironment = useCallback(
    async importData => {
      try {
        setLoading(true);
        setError(null);

        let environmentData;

        // Try to detect if it's API Client format
        if (importData._api_client_variable_scope === 'environment' || importData.values) {
          environmentData = EnvironmentApiService.fromApiClientFormat(importData);
        } else {
          environmentData = importData;
        }

        const validation = EnvironmentApiService.validateEnvironment(environmentData);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }

        const response = await EnvironmentApiService.importEnvironment(environmentData);
        await loadEnvironments(); // Refresh list

        return response;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadEnvironments]
  );

  // Save environment (create or update)
  const saveEnvironment = useCallback(
    async environmentData => {
      if (environmentData.id && environments.some(env => env.id === environmentData.id)) {
        return updateEnvironment(environmentData.id, environmentData);
      } else {
        return createEnvironment(environmentData);
      }
    },
    [environments, createEnvironment, updateEnvironment]
  );

  // Substitute variables in text
  const substituteVariables = useCallback(
    text => {
      if (!activeEnvironment) return text;
      return EnvironmentApiService.substituteVariables(text, activeEnvironment.variables);
    },
    [activeEnvironment]
  );

  // Get variable suggestions for autocomplete
  const getVariableSuggestions = useCallback(() => {
    return EnvironmentApiService.getVariableSuggestions(environments);
  }, [environments]);

  // Initialize on mount
  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  return {
    // State
    environments,
    activeEnvironment,
    loading,
    error,

    // Actions
    loadEnvironments,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    saveEnvironment,
    setActiveEnvironment: setActiveEnvironmentById,
    exportEnvironment,
    exportAllEnvironments,
    importEnvironment,

    // Utilities
    substituteVariables,
    getVariableSuggestions,

    // Clear error
    clearError: () => setError(null),
  };
};

export default useEnvironments;
