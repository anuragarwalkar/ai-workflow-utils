const STORAGE_KEY = 'gitstash_project_config';
import { API_BASE_URL } from '../../../config/environment.js';

/**
 * Save project configuration to API
 * @param {object} projectData - Project data to save
 * @returns {Promise<boolean>} Success status
 */
export const saveProjectConfig = async (projectData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/app-state/${STORAGE_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Load project configuration from API
 * @returns {Promise<object|null>} Saved project data or null
 */
export const loadProjectConfig = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/app-state/${STORAGE_KEY}`);
    if (!response.ok) return null;
    
    const json = await response.json();
    return json.data || null;
  } catch {
    return null;
  }
};
