/**
 * Custom hook for managing PR form state and localStorage persistence
 */

import { useEffect, useState } from 'react';
import { DEFAULT_FORM_STATE, FORM_FIELDS } from '../constants/pr.js';
import { loadProjectConfig, saveProjectConfig } from '../services/prStorageService.js';
import { createLogger } from '../utils/log.js';

const logger = createLogger('usePRForm');

/**
 * Hook for managing PR form state
 * @returns {object} Form state and handlers
 */
export const usePRForm = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);

  // Load saved configuration on mount
  useEffect(() => {
    logger.info('useEffect', 'Loading saved project configuration');
    
    const savedConfig = loadProjectConfig();
    if (savedConfig) {
      setFormData(prev => ({
        ...prev,
        [FORM_FIELDS.PROJECT_KEY]: savedConfig[FORM_FIELDS.PROJECT_KEY],
        [FORM_FIELDS.REPO_SLUG]: savedConfig[FORM_FIELDS.REPO_SLUG],
      }));
      logger.info('useEffect', 'Saved configuration loaded successfully');
    }
  }, []);

  /**
   * Handle form field changes
   * @param {string} field - Field name to update
   * @param {string} value - New value for the field
   */
  const handleFieldChange = (field, value) => {
    logger.debug('handleFieldChange', `Updating field: ${field}`, { field, value });
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Update entire form data
   * @param {object} newData - New form data
   */
  const updateFormData = (newData) => {
    logger.debug('updateFormData', 'Updating entire form data', newData);
    setFormData(newData);
  };

  /**
   * Reset form to default state
   */
  const resetForm = () => {
    logger.info('resetForm', 'Resetting form to default state');
    setFormData(DEFAULT_FORM_STATE);
  };

  /**
   * Reset only the branch name field
   */
  const resetBranchName = () => {
    logger.info('resetBranchName', 'Resetting branch name field');
    setFormData(prev => ({
      ...prev,
      [FORM_FIELDS.BRANCH_NAME]: '',
    }));
  };

  /**
   * Save current project configuration to localStorage
   */
  const saveCurrentConfig = () => {
    try {
      logger.info('saveCurrentConfig', 'Saving current project configuration');
      saveProjectConfig(formData[FORM_FIELDS.PROJECT_KEY], formData[FORM_FIELDS.REPO_SLUG]);
    } catch (error) {
      logger.error('saveCurrentConfig', 'Failed to save project configuration', error);
    }
  };

  /**
   * Check if form is valid for submission
   * @returns {boolean} Whether form is valid
   */
  const isFormValid = () => {
    const isValid = !!(
      formData[FORM_FIELDS.PROJECT_KEY] &&
      formData[FORM_FIELDS.REPO_SLUG] &&
      formData[FORM_FIELDS.BRANCH_NAME]
    );
    
    logger.debug('isFormValid', `Form validation result: ${isValid}`, formData);
    return isValid;
  };

  return {
    formData,
    handleFieldChange,
    updateFormData,
    resetForm,
    resetBranchName,
    saveCurrentConfig,
    isFormValid,
  };
};
