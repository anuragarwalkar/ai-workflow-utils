/**
 * Service for handling localStorage operations related to PR functionality
 */

import { FORM_FIELDS, STORAGE_KEYS } from '../constants/pr.js';
import { createLogger } from '../utils/log.js';

const logger = createLogger('PRStorageService');

/**
 * Save project configuration to localStorage
 * @param {string} projectKey - Project key to save
 * @param {string} repoSlug - Repository slug to save
 */
export const saveProjectConfig = (projectKey, repoSlug) => {
  try {
    logger.info('saveProjectConfig', 'Saving project configuration', { projectKey, repoSlug });
    
    const config = {
      [FORM_FIELDS.PROJECT_KEY]: projectKey,
      [FORM_FIELDS.REPO_SLUG]: repoSlug,
    };
    
    localStorage.setItem(STORAGE_KEYS.PROJECT_CONFIG, JSON.stringify(config));
    logger.info('saveProjectConfig', 'Project configuration saved successfully');
  } catch (error) {
    logger.error('saveProjectConfig', 'Failed to save project configuration', error);
    throw new Error('Failed to save project configuration');
  }
};

/**
 * Load project configuration from localStorage
 * @returns {object|null} Saved configuration or null if not found
 */
export const loadProjectConfig = () => {
  try {
    logger.debug('loadProjectConfig', 'Loading project configuration');
    
    const savedConfig = localStorage.getItem(STORAGE_KEYS.PROJECT_CONFIG);
    if (!savedConfig) {
      logger.debug('loadProjectConfig', 'No saved configuration found');
      return null;
    }
    
    const config = JSON.parse(savedConfig);
    logger.info('loadProjectConfig', 'Project configuration loaded successfully', config);
    
    return {
      [FORM_FIELDS.PROJECT_KEY]: config[FORM_FIELDS.PROJECT_KEY] || '',
      [FORM_FIELDS.REPO_SLUG]: config[FORM_FIELDS.REPO_SLUG] || '',
    };
  } catch (error) {
    logger.error('loadProjectConfig', 'Failed to load project configuration', error);
    return null;
  }
};

/**
 * Clear project configuration from localStorage
 */
export const clearProjectConfig = () => {
  try {
    logger.info('clearProjectConfig', 'Clearing project configuration');
    localStorage.removeItem(STORAGE_KEYS.PROJECT_CONFIG);
    logger.info('clearProjectConfig', 'Project configuration cleared successfully');
  } catch (error) {
    logger.error('clearProjectConfig', 'Failed to clear project configuration', error);
    throw new Error('Failed to clear project configuration');
  }
};
