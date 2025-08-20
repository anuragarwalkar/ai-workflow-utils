const STORAGE_KEY = 'gitstash_project_config';

/**
 * Pure function to save project configuration to localStorage
 * @param {object} projectData - Project data to save
 * @returns {boolean} Success status
 */
export const saveProjectConfig = (projectData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
    return true;
  } catch {
    return false;
  }
};

/**
 * Pure function to load project configuration from localStorage
 * @returns {object|null} Saved project data or null
 */
export const loadProjectConfig = () => {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    return savedConfig ? JSON.parse(savedConfig) : null;
  } catch {
    return null;
  }
};
