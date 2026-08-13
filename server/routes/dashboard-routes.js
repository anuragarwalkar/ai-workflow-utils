import express from 'express';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Slack
router.get('/slack/items', dashboardController.getSlackItems);
router.get('/slack/channels', dashboardController.getSlackChannels);
router.post('/slack/test', dashboardController.testSlackConnection);

// Todos
router.get('/todos', dashboardController.getTodos);
router.post('/todos', dashboardController.createTodo);
router.patch('/todos/:id', dashboardController.updateTodo);
router.delete('/todos/:id', dashboardController.deleteTodo);

// Summaries / Knowledge Dump
router.post('/summarize', dashboardController.runSummarize);
router.post('/summaries/search', dashboardController.searchSummaries);

export default router;
