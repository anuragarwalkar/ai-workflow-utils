import express from 'express';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Command Bar
router.post('/command', dashboardController.processCommand);

// Slack
router.get('/slack/items', dashboardController.getSlackItems);
router.get('/slack/channels', dashboardController.getSlackChannels);
router.post('/slack/test', dashboardController.testSlackConnection);

// Todos
router.get('/todos', dashboardController.getTodos);
router.post('/todos', dashboardController.createTodo);
router.patch('/todos/:id', dashboardController.updateTodo);
router.delete('/todos/:id', dashboardController.deleteTodo);

// Reminders
router.get('/reminders', dashboardController.getReminders);
router.post('/reminders', dashboardController.createReminder);
router.patch('/reminders/:id', dashboardController.updateReminder);
router.delete('/reminders/:id', dashboardController.deleteReminder);

// Notes
router.get('/notes', dashboardController.getNotes);
router.post('/notes', dashboardController.createNote);
router.patch('/notes/:id', dashboardController.updateNote);
router.delete('/notes/:id', dashboardController.deleteNote);

// Tile Config
router.get('/tiles/config', dashboardController.getTileConfig);
router.put('/tiles/config', dashboardController.updateTileConfig);

// Summaries / Knowledge Dump
router.post('/summarize', dashboardController.runSummarize);
router.post('/summaries/search', dashboardController.searchSummaries);

export default router;
