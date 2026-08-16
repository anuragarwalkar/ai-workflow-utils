import express from 'express';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Command Bar & Models
router.get('/models', dashboardController.getAvailableModels);
router.post('/command', dashboardController.processCommand);

// Todos
router.get('/todos', dashboardController.getTodos);
router.post('/todos', dashboardController.createTodo);
router.put('/todos/reorder', dashboardController.reorderTodos);
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
router.post('/notes/generate', dashboardController.generateNote);
router.post('/notes/improve-writing', dashboardController.improveWriting);
router.get('/notes/:id', dashboardController.getNoteById);
router.patch('/notes/:id', dashboardController.updateNote);
router.delete('/notes/:id', dashboardController.deleteNote);
router.post('/notes/:id/pin', dashboardController.toggleNotePin);
router.post('/notes/:id/favorite', dashboardController.toggleNoteFavorite);
router.post('/notes/:id/summarize', dashboardController.summarizeNote);
router.post('/notes/:id/auto-tag', dashboardController.autoTagNote);
router.post('/notes/:id/expand', dashboardController.expandNote);
router.get('/notes/:id/related', dashboardController.suggestRelatedNotes);

// Tile Config
router.get('/tiles/config', dashboardController.getTileConfig);
router.put('/tiles/config', dashboardController.updateTileConfig);

// Summaries / Knowledge Dump
router.post('/summarize', dashboardController.runSummarize);
router.post('/summaries/search', dashboardController.searchSummaries);

// Notifications
router.get('/notifications', dashboardController.getNotifications);
router.get('/notifications/unread-count', dashboardController.getUnreadNotificationCount);
router.patch('/notifications/:id/read', dashboardController.markNotificationRead);
router.post('/notifications/mark-all-read', dashboardController.markAllNotificationsRead);
router.delete('/notifications/:id', dashboardController.deleteNotification);
router.delete('/notifications', dashboardController.clearAllNotifications);
router.post('/notifications/test', dashboardController.triggerTestNotification);

// Vector DB / LanceDB Explorer
router.get('/lancedb/stats', dashboardController.getLanceDbStats);
router.get('/lancedb/tables/:tableName/records', dashboardController.getLanceDbTableRecords);
router.get('/lancedb/tables/:tableName/schema', dashboardController.getLanceDbTableSchema);
router.delete('/lancedb/tables/:tableName/records/:id', dashboardController.deleteLanceDbRecord);
router.post('/lancedb/tables/:tableName/records/bulk-delete', dashboardController.bulkDeleteLanceDbRecords);
router.post('/lancedb/records', dashboardController.insertLanceDbRecord);
router.post('/lancedb/reindex', dashboardController.reindexNotesToLanceDb);
router.post('/lancedb/search', dashboardController.searchLanceDb);
router.get('/lancedb/diagnostics', dashboardController.getLanceDbDiagnostics);

export default router;
