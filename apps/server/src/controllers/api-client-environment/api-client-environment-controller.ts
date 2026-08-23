import { Request, Response } from 'express';
import apiClientEnvironmentDbService from '../../services/apiClientEnvironmentDbService.ts';
import logger from '../../logger.ts';

export const createEnvironment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, variables } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Environment name is required',
      });
      return;
    }

    const environment = await apiClientEnvironmentDbService.createEnvironment({
      name,
      variables: variables || [],
    });

    res.json({
      success: true,
      data: environment,
    });
  } catch (error: any) {
    logger.error('Failed to create environment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getApiClientEnvironments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const environments = await apiClientEnvironmentDbService.getEnvironments();

    res.json({
      success: true,
      data: environments,
    });
  } catch (error: any) {
    logger.error('Failed to get environments:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getEnvironment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const environment = await apiClientEnvironmentDbService.getEnvironment(id);

    res.json({
      success: true,
      data: environment,
    });
  } catch (error: any) {
    logger.error('Failed to get environment:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateEnvironment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, variables } = req.body;

    const environment = await apiClientEnvironmentDbService.updateEnvironment(id, {
      name,
      variables,
    });

    res.json({
      success: true,
      data: environment,
    });
  } catch (error: any) {
    logger.error('Failed to update environment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const deleteEnvironment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    await apiClientEnvironmentDbService.deleteEnvironment(id);

    res.json({
      success: true,
      data: { message: 'Environment deleted successfully' },
    });
  } catch (error: any) {
    logger.error('Failed to delete environment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const setActiveEnvironment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    await apiClientEnvironmentDbService.setActiveEnvironment(id);

    res.json({
      success: true,
      data: { message: 'Active environment set successfully' },
    });
  } catch (error: any) {
    logger.error('Failed to set active environment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getActiveEnvironment = async (_req: Request, res: Response): Promise<void> => {
  try {
    const environment = await apiClientEnvironmentDbService.getActiveEnvironment();

    res.json({
      success: true,
      data: environment,
    });
  } catch (error: any) {
    logger.error('Failed to get active environment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const importEnvironment = async (req: Request, res: Response): Promise<void> => {
  try {
    const apiClientEnvironment = req.body;

    if (!apiClientEnvironment || !apiClientEnvironment.name) {
      res.status(400).json({
        success: false,
        error: 'Environment data with name is required',
      });
      return;
    }

    const environment = await apiClientEnvironmentDbService.importEnvironment(apiClientEnvironment);

    res.json({
      success: true,
      data: environment,
    });
  } catch (error: any) {
    logger.error('Failed to import environment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const exportEnvironment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const environment = await apiClientEnvironmentDbService.exportEnvironment(id);

    res.json({
      success: true,
      data: environment,
    });
  } catch (error: any) {
    logger.error('Failed to export environment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const exportAllEnvironments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const environments = await apiClientEnvironmentDbService.exportAllEnvironments();

    res.json({
      success: true,
      data: environments,
    });
  } catch (error: any) {
    logger.error('Failed to export all environments:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
