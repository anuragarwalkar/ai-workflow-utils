import { Request, Response } from 'express';
import apiClientCollectionDbService from '../../services/apiClientCollectionDbService.ts';
import logger from '../../logger.ts';

export const createCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, requests } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Collection name is required',
      });
      return;
    }

    const collection = await apiClientCollectionDbService.createCollection({
      name,
      description: description || '',
      requests: requests || [],
    });

    res.json({
      success: true,
      data: collection,
    });
  } catch (error: any) {
    logger.error('Failed to create collection:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getCollections = async (_req: Request, res: Response): Promise<void> => {
  try {
    const collections = await apiClientCollectionDbService.getCollections();

    res.json({
      success: true,
      data: collections,
    });
  } catch (error: any) {
    logger.error('Failed to get collections:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const collection = await apiClientCollectionDbService.getCollection(id);

    res.json({
      success: true,
      data: collection,
    });
  } catch (error: any) {
    logger.error('Failed to get collection:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, description, requests, auth, variable } = req.body;

    const collection = await apiClientCollectionDbService.updateCollection(id, {
      name,
      description,
      requests,
      auth,
      variable,
    });

    res.json({
      success: true,
      data: collection,
    });
  } catch (error: any) {
    logger.error('Failed to update collection:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const deleteCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    await apiClientCollectionDbService.deleteCollection(id);

    res.json({
      success: true,
      data: { message: 'Collection deleted successfully' },
    });
  } catch (error: any) {
    logger.error('Failed to delete collection:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const importCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { collection } = req.body;

    if (!collection) {
      res.status(400).json({
        success: false,
        error: 'Collection data is required',
      });
      return;
    }

    logger.info('📥 API Client: Importing Postman collection');

    const importedCollection = await apiClientCollectionDbService.importCollection(collection);

    res.json({
      success: true,
      data: importedCollection,
      message: 'Collection imported successfully',
    });
  } catch (error: any) {
    logger.error('❌ API Client: Failed to import collection:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to import collection',
    });
  }
};

export const exportCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    logger.info(`📤 API Client: Exporting collection ${id} to Postman format`);

    const collection = await apiClientCollectionDbService.exportCollection(id);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${collection.info.name.replace(/[^a-z0-9]/gi, '_')}.postman_collection.json`
    );
    res.json(collection);
  } catch (error: any) {
    logger.error('❌ API Client: Failed to export collection:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export collection',
    });
  }
};

export const exportAllCollections = async (_req: Request, res: Response): Promise<void> => {
  try {
    logger.info('📤 API Client: Exporting all collections to Postman format');

    const data = await apiClientCollectionDbService.exportAllCollections();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ai-workflow-utils-collections.json');
    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('❌ API Client: Failed to export all collections:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export collections',
    });
  }
};
