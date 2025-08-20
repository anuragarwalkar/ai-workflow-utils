import apiClientCollectionDbService from '../../services/apiClientCollectionDbService.js';
import logger from '../../logger.js';

/**
 * Create a new collection
 */
export const createCollection = async (req, res) => {
  try {
    const { name, description, requests } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Collection name is required'
      });
    }

    const collection = await apiClientCollectionDbService.createCollection({
      name,
      description: description || '',
      requests: requests || []
    });

    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    logger.error('Failed to create collection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all collections
 */
export const getCollections = async (req, res) => {
  try {
    const collections = await apiClientCollectionDbService.getCollections();

    res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    logger.error('Failed to get collections:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a specific collection
 */
export const getCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await apiClientCollectionDbService.getCollection(id);

    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    logger.error('Failed to get collection:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update a collection
 */
export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, requests, auth, variable } = req.body;

    const collection = await apiClientCollectionDbService.updateCollection(id, {
      name,
      description,
      requests,
      auth,
      variable
    });

    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    logger.error('Failed to update collection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a collection
 */
export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    await apiClientCollectionDbService.deleteCollection(id);

    res.json({
      success: true,
      data: { message: 'Collection deleted successfully' }
    });
  } catch (error) {
    logger.error('Failed to delete collection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Import a collection (Postman format)
 */
export const importCollection = async (req, res) => {
  try {
    const { collection } = req.body;

    if (!collection) {
      return res.status(400).json({
        success: false,
        error: 'Collection data is required'
      });
    }

    logger.info('📥 API Client: Importing Postman collection');

    const importedCollection = await apiClientCollectionDbService.importCollection(collection);

    res.json({
      success: true,
      data: importedCollection,
      message: 'Collection imported successfully'
    });
  } catch (error) {
    logger.error('❌ API Client: Failed to import collection:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to import collection'
    });
  }
};

/**
 * Export a specific collection (Postman format)
 */
export const exportCollection = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`📤 API Client: Exporting collection ${id} to Postman format`);

    const collection = await apiClientCollectionDbService.exportCollection(id);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${collection.info.name.replace(/[^a-z0-9]/gi, '_')}.postman_collection.json`);
    res.json(collection);
  } catch (error) {
    logger.error('❌ API Client: Failed to export collection:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export collection'
    });
  }
};

/**
 * Export all collections (Postman format)
 */
export const exportAllCollections = async (req, res) => {
  try {
    logger.info('📤 API Client: Exporting all collections to Postman format');

    const data = await apiClientCollectionDbService.exportAllCollections();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ai-workflow-utils-collections.json');
    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('❌ API Client: Failed to export all collections:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export collections'
    });
  }
};
