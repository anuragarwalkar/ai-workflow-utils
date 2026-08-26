/**
 * Service for handling API operations related to PR functionality
 */

import { FORM_FIELDS, STORAGE_KEYS } from '../constants/pr.js';
import { createLogger } from '../utils/log.js';
import { API_BASE_URL } from '../config/environment.js';

const logger = createLogger('PRStorageService');

/**
 * Save project configuration to API
 * @param {string} projectKey - Project key to save
 * @param {string} repoSlug - Repository slug to save
 */
export const saveProjectConfig = async (projectKey, repoSlug) => {
  try {
    logger.info('saveProjectConfig', 'Saving project configuration', { projectKey, repoSlug });
    
    const config = {
      [FORM_FIELDS.PROJECT_KEY]: projectKey,
      [FORM_FIELDS.REPO_SLUG]: repoSlug,
    };
    
    const response = await fetch(`${API_BASE_URL}/api/app-state/${STORAGE_KEYS.PROJECT_CONFIG}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to save project configuration to API');
    }

    logger.info('saveProjectConfig', 'Project configuration saved successfully');
  } catch (error) {
    logger.error('saveProjectConfig', 'Failed to save project configuration', error);
    throw new Error('Failed to save project configuration');
  }
};

/**
 * Load project configuration from API
 * @returns {Promise<object|null>} Saved configuration or null if not found
 */
export const loadProjectConfig = async () => {
  try {
    logger.debug('loadProjectConfig', 'Loading project configuration');
    
    const response = await fetch(`${API_BASE_URL}/api/app-state/${STORAGE_KEYS.PROJECT_CONFIG}`);
    if (!response.ok) {
      logger.debug('loadProjectConfig', 'No saved configuration found');
      return null;
    }

    const json = await response.json();
    const config = json.data;

    if (!config) {
      return null;
    }
    
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
 * Clear project configuration from API
 */
export const clearProjectConfig = async () => {
  try {
    logger.info('clearProjectConfig', 'Clearing project configuration');
    const response = await fetch(`${API_BASE_URL}/api/app-state/${STORAGE_KEYS.PROJECT_CONFIG}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete configuration');
    }

    logger.info('clearProjectConfig', 'Project configuration cleared successfully');
  } catch (error) {
    logger.error('clearProjectConfig', 'Failed to clear project configuration', error);
    throw new Error('Failed to clear project configuration');
  }
};
