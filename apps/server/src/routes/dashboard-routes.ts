import express from 'express';
import dashboardController from '../controllers/dashboardController.ts';

const router = express.Router();

// Command Bar & Models
router.get('/models', dashboardController.getAvailableModels.bind(dashboardController));
router.post('/command', dashboardController.processCommand.bind(dashboardController));

// Todos
router.get('/todos', dashboardController.getTodos.bind(dashboardController));
router.post('/todos', dashboardController.createTodo.bind(dashboardController));
router.put('/todos/reorder', dashboardController.reorderTodos.bind(dashboardController));
router.patch('/todos/:id', dashboardController.updateTodo.bind(dashboardController));
router.delete('/todos/:id', dashboardController.deleteTodo.bind(dashboardController));

// Reminders
router.get('/reminders', dashboardController.getReminders.bind(dashboardController));
router.post('/reminders', dashboardController.createReminder.bind(dashboardController));
router.patch('/reminders/:id', dashboardController.updateReminder.bind(dashboardController));
router.delete('/reminders/:id', dashboardController.deleteReminder.bind(dashboardController));

// Notes
router.get('/notes', dashboardController.getNotes.bind(dashboardController));
router.post('/notes', dashboardController.createNote.bind(dashboardController));
router.post('/notes/generate', dashboardController.generateNote.bind(dashboardController));
router.post('/notes/improve-writing', dashboardController.improveWriting.bind(dashboardController));
router.get('/notes/:id', dashboardController.getNoteById.bind(dashboardController));
router.patch('/notes/:id', dashboardController.updateNote.bind(dashboardController));
router.delete('/notes/:id', dashboardController.deleteNote.bind(dashboardController));
router.post('/notes/:id/pin', dashboardController.toggleNotePin.bind(dashboardController));
router.post('/notes/:id/favorite', dashboardController.toggleNoteFavorite.bind(dashboardController));
router.post('/notes/:id/summarize', dashboardController.summarizeNote.bind(dashboardController));
router.post('/notes/:id/auto-tag', dashboardController.autoTagNote.bind(dashboardController));
router.post('/notes/:id/expand', dashboardController.expandNote.bind(dashboardController));
router.get('/notes/:id/related', dashboardController.suggestRelatedNotes.bind(dashboardController));

// Tile Config
router.get('/tiles/config', dashboardController.getTileConfig.bind(dashboardController));
router.put('/tiles/config', dashboardController.updateTileConfig.bind(dashboardController));

// Summaries / Knowledge Dump
router.post('/summarize', dashboardController.runSummarize.bind(dashboardController));
router.post('/summaries/search', dashboardController.searchSummaries.bind(dashboardController));

// Notifications
router.get('/notifications', dashboardController.getNotifications.bind(dashboardController));
router.get('/notifications/unread-count', dashboardController.getUnreadNotificationCount.bind(dashboardController));
router.patch('/notifications/:id/read', dashboardController.markNotificationRead.bind(dashboardController));
router.post('/notifications/mark-all-read', dashboardController.markAllNotificationsRead.bind(dashboardController));
router.delete('/notifications/:id', dashboardController.deleteNotification.bind(dashboardController));
router.delete('/notifications', dashboardController.clearAllNotifications.bind(dashboardController));
router.post('/notifications/test', dashboardController.triggerTestNotification.bind(dashboardController));

// Vector DB / LanceDB Explorer
router.get('/lancedb/stats', dashboardController.getLanceDbStats.bind(dashboardController));
router.get('/lancedb/tables/:tableName/records', dashboardController.getLanceDbTableRecords.bind(dashboardController));
router.get('/lancedb/tables/:tableName/schema', dashboardController.getLanceDbTableSchema.bind(dashboardController));
router.delete('/lancedb/tables/:tableName/records/:id', dashboardController.deleteLanceDbRecord.bind(dashboardController));
router.post('/lancedb/tables/:tableName/records/bulk-delete', dashboardController.bulkDeleteLanceDbRecords.bind(dashboardController));
router.post('/lancedb/records', dashboardController.insertLanceDbRecord.bind(dashboardController));
router.post('/lancedb/reindex', dashboardController.reindexNotesToLanceDb.bind(dashboardController));
router.post('/lancedb/search', dashboardController.searchLanceDb.bind(dashboardController));
router.get('/lancedb/diagnostics', dashboardController.getLanceDbDiagnostics.bind(dashboardController));

export default router;
