import apiClientEnvironmentDbService from '../../services/apiClientEnvironmentDbService.js';
import logger from '../../logger.js';

/**
 * Create a new environment
 */
export const createEnvironment = async (req, res) => {
  try {
    const { name, variables } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Environment name is required'
      });
    }

    const environment = await apiClientEnvironmentDbService.createEnvironment({
      name,
      variables: variables || []
    });

    res.json({
      success: true,
      data: environment
    });
  } catch (error) {
    logger.error('Failed to create environment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all environments
 */
export const getEnvironments = async (req, res) => {
  try {
    const environments = await apiClientEnvironmentDbService.getEnvironments();

    res.json({
      success: true,
      data: environments
    });
  } catch (error) {
    logger.error('Failed to get environments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a specific environment
 */
export const getEnvironment = async (req, res) => {
  try {
    const { id } = req.params;

    const environment = await apiClientEnvironmentDbService.getEnvironment(id);

    res.json({
      success: true,
      data: environment
    });
  } catch (error) {
    logger.error('Failed to get environment:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update an environment
 */
export const updateEnvironment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, variables } = req.body;

    const environment = await apiClientEnvironmentDbService.updateEnvironment(id, {
      name,
      variables
    });

    res.json({
      success: true,
      data: environment
    });
  } catch (error) {
    logger.error('Failed to update environment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete an environment
 */
export const deleteEnvironment = async (req, res) => {
  try {
    const { id } = req.params;

    await apiClientEnvironmentDbService.deleteEnvironment(id);

    res.json({
      success: true,
      data: { message: 'Environment deleted successfully' }
    });
  } catch (error) {
    logger.error('Failed to delete environment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Set active environment
 */
export const setActiveEnvironment = async (req, res) => {
  try {
    const { id } = req.params;

    await apiClientEnvironmentDbService.setActiveEnvironment(id);

    res.json({
      success: true,
      data: { message: 'Active environment set successfully' }
    });
  } catch (error) {
    logger.error('Failed to set active environment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get active environment
 */
export const getActiveEnvironment = async (req, res) => {
  try {
    const environment = await apiClientEnvironmentDbService.getActiveEnvironment();

    res.json({
      success: true,
      data: environment
    });
  } catch (error) {
    logger.error('Failed to get active environment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Import environment from Postman v2.1 format
 */
export const importEnvironment = async (req, res) => {
  try {
    const postmanEnvironment = req.body;

    if (!postmanEnvironment || !postmanEnvironment.name) {
      return res.status(400).json({
        success: false,
        error: 'Environment data with name is required'
      });
    }

    const environment = await apiClientEnvironmentDbService.importEnvironment(postmanEnvironment);

    res.json({
      success: true,
      data: environment
    });
  } catch (error) {
    logger.error('Failed to import environment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Export environment in Postman v2.1 format
 */
export const exportEnvironment = async (req, res) => {
  try {
    const { id } = req.params;

    const environment = await apiClientEnvironmentDbService.exportEnvironment(id);

    res.json({
      success: true,
      data: environment
    });
  } catch (error) {
    logger.error('Failed to export environment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Export all environments
 */
export const exportAllEnvironments = async (req, res) => {
  try {
    const environments = await apiClientEnvironmentDbService.exportAllEnvironments();

    res.json({
      success: true,
      data: environments
    });
  } catch (error) {
    logger.error('Failed to export all environments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
