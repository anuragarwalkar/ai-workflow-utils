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
  const [attachedImages, setAttachedImages] = useState([]);

  // Load saved configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      logger.info('useEffect', 'Loading saved project configuration');
      
      const savedConfig = await loadProjectConfig();
      if (savedConfig) {
        setFormData(prev => ({
          ...prev,
          [FORM_FIELDS.PROJECT_KEY]: savedConfig[FORM_FIELDS.PROJECT_KEY],
          [FORM_FIELDS.REPO_SLUG]: savedConfig[FORM_FIELDS.REPO_SLUG],
        }));
        logger.info('useEffect', 'Saved configuration loaded successfully');
      }
    };
    
    loadConfig();
  }, []);

  /**
   * Add new images to attachedImages state
   * @param {File[]} files
   */
  const handleAddImages = (files) => {
    logger.debug('handleAddImages', `Adding ${files.length} images`);
    const newImages = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setAttachedImages(prev => [...prev, ...newImages]);
  };

  /**
   * Remove an image by ID and revoke its object URL
   * @param {string} imageId
   */
  const handleRemoveImage = (imageId) => {
    logger.debug('handleRemoveImage', `Removing image: ${imageId}`);
    setAttachedImages(prev => {
      const target = prev.find(img => img.id === imageId);
      if (target?.url) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  /**
   * Clear all attached images and revoke URLs
   */
  const clearAttachedImages = () => {
    logger.debug('clearAttachedImages', 'Clearing all attached images');
    attachedImages.forEach(img => {
      if (img.url) {
        URL.revokeObjectURL(img.url);
      }
    });
    setAttachedImages([]);
  };

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
    clearAttachedImages();
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
   * Save current project configuration to API
   */
  const saveCurrentConfig = async () => {
    try {
      logger.info('saveCurrentConfig', 'Saving current project configuration');
      await saveProjectConfig(formData[FORM_FIELDS.PROJECT_KEY], formData[FORM_FIELDS.REPO_SLUG]);
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
    attachedImages,
    handleAddImages,
    handleRemoveImage,
    clearAttachedImages,
    handleFieldChange,
    updateFormData,
    resetForm,
    resetBranchName,
    saveCurrentConfig,
    isFormValid,
  };
};
