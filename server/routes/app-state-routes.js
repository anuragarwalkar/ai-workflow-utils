import express from 'express';
import appStateDbService from '../services/appStateDbService.js';
import logger from '../logger.js';

const router = express.Router();

/**
 * @route   GET /api/app-state/:key
 * @desc    Get an app state value by key
 * @access  Public
 */
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await appStateDbService.getState(key);
    
    if (value === null || value === undefined) {
      return res.status(404).json({ message: 'State not found for the given key', data: null });
    }

    res.json({ message: 'State retrieved successfully', data: value });
  } catch (error) {
    logger.error('Error in GET /api/app-state/:key:', error);
    res.status(500).json({ error: 'Failed to retrieve state' });
  }
});

/**
 * @route   POST /api/app-state/:key
 * @desc    Set an app state value by key
 * @access  Public
 */
router.post('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = req.body;
    
    const updatedValue = await appStateDbService.setState(key, value);
    res.json({ message: 'State updated successfully', data: updatedValue });
  } catch (error) {
    logger.error('Error in POST /api/app-state/:key:', error);
    res.status(500).json({ error: 'Failed to update state' });
  }
});

/**
 * @route   DELETE /api/app-state/:key
 * @desc    Delete an app state value by key
 * @access  Public
 */
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const success = await appStateDbService.deleteState(key);
    
    if (success) {
      res.json({ message: 'State deleted successfully' });
    } else {
      res.status(404).json({ error: 'State not found for the given key' });
    }
  } catch (error) {
    logger.error('Error in DELETE /api/app-state/:key:', error);
    res.status(500).json({ error: 'Failed to delete state' });
  }
});

export default router;
