import express, { Request, Response } from 'express';
import appStateDbService from '../services/appStateDbService.ts';
import logger from '../logger.ts';

const router = express.Router();

router.get('/:key', async (req: Request, res: Response): Promise<void> => {
  try {
    const key = String(req.params.key);
    const value = await appStateDbService.getState(key);

    if (value === null || value === undefined) {
      res.status(404).json({ message: 'State not found for the given key', data: null });
      return;
    }

    res.json({ message: 'State retrieved successfully', data: value });
  } catch (error: any) {
    logger.error('Error in GET /api/app-state/:key:', error);
    res.status(500).json({ error: 'Failed to retrieve state' });
  }
});

router.post('/:key', async (req: Request, res: Response): Promise<void> => {
  try {
    const key = String(req.params.key);
    const value = req.body;

    const updatedValue = await appStateDbService.setState(key, value);
    res.json({ message: 'State updated successfully', data: updatedValue });
  } catch (error: any) {
    logger.error('Error in POST /api/app-state/:key:', error);
    res.status(500).json({ error: 'Failed to update state' });
  }
});

router.delete('/:key', async (req: Request, res: Response): Promise<void> => {
  try {
    const key = String(req.params.key);
    const success = await appStateDbService.deleteState(key);

    if (success) {
      res.json({ message: 'State deleted successfully' });
    } else {
      res.status(404).json({ error: 'State not found for the given key' });
    }
  } catch (error: any) {
    logger.error('Error in DELETE /api/app-state/:key:', error);
    res.status(500).json({ error: 'Failed to delete state' });
  }
});

export default router;
