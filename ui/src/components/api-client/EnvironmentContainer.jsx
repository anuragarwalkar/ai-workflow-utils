/* eslint-disable no-useless-catch */
import React from 'react';
import { Alert, Box } from '@mui/material';
import EnvironmentManager from './EnvironmentManager';
import EnvironmentSelector from './EnvironmentSelector';
import { useEnvironments } from '../../hooks/useEnvironments';
import logger from '../../../../server/logger';

// Container component that provides environment management functionality
const EnvironmentContainer = ({ 
  children, 
  showManager = false, 
  showSelector = true,
  compact = false 
}) => {
  const {
    environments,
    activeEnvironment,
    loading,
    error,
    saveEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    exportEnvironment,
    importEnvironment,
    clearError,
  } = useEnvironments();

  const handleEnvironmentChange = async (environment) => {
    try {
      await setActiveEnvironment(environment.id);
    } catch (err) {
      logger.error(err)
      // Error handling is managed by the hook
    }
  };

  const handleEnvironmentSave = async (environmentData) => {
    try {
      await saveEnvironment(environmentData);
    } catch (err) {
      logger.error(err)
      // Error handling is managed by the hook
    }
  };

  const handleEnvironmentDelete = async (id) => {
    try {
      await deleteEnvironment(id);
    } catch (err) {
      logger.error(err)
      // Error handling is managed by the hook
    }
  };

  const handleEnvironmentExport = async (id) => {
    try {
      return await exportEnvironment(id);
    } catch (err) {
      logger.error(err)
      // Error handling is managed by the hook
      throw err;
    }
  };

  const handleEnvironmentImport = async (importData) => {
    try {
      await importEnvironment(importData);
    } catch (err) {
      logger.error(err)
      // Error handling is managed by the hook
    }
  };

  return (
    <Box>
      {error ? <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert> : null}

      {showSelector ? <Box mb={showManager ? 2 : 0}>
          <EnvironmentSelector
            activeEnvironment={activeEnvironment}
            compact={compact}
            onEnvironmentChange={handleEnvironmentChange}
          />
        </Box> : null}

      {showManager ? <EnvironmentManager
          activeEnvironment={activeEnvironment}
          environments={environments}
          onEnvironmentChange={handleEnvironmentChange}
          onEnvironmentDelete={handleEnvironmentDelete}
          onEnvironmentExport={handleEnvironmentExport}
          onEnvironmentImport={handleEnvironmentImport}
          onEnvironmentSave={handleEnvironmentSave}
        /> : null}

      {children ? React.cloneElement(children, {
        activeEnvironment,
        environments,
        loading,
      }) : null}
    </Box>
  );
};

export default EnvironmentContainer;
