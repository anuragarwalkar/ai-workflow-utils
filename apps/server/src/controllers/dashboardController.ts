import { Request, Response } from 'express';
import todoDbService from '../services/dashboard/TodoDbService.ts';
import dashboardLangGraphService from '../services/dashboard/DashboardLangGraphService.ts';
import memoryService from '../services/dashboard/MemoryService.ts';
import reminderDbService from '../services/dashboard/ReminderDbService.ts';
import noteDbService from '../services/dashboard/NoteDbService.ts';
import noteAiService from '../services/dashboard/NoteAiService.ts';
import tileConfigDbService from '../services/dashboard/TileConfigDbService.ts';
import notificationDbService from '../services/dashboard/NotificationDbService.ts';
import dashboardNotificationService from '../services/dashboard/DashboardNotificationService.ts';
import dashboardIntentGraph from '../services/dashboard/DashboardIntentGraph.ts';
import lanceDbService from '../services/dashboard/LanceDbService.ts';
import langChainServiceFactory from '../services/langchain/LangChainServiceFactory.ts';
import { setupSSEHeaders } from './chat/processors/streaming-processor.js';
import { PromptTemplate } from '@langchain/core/prompts';
import logger from '../logger.ts';

class DashboardController {
  async getAvailableModels(req: Request, res: Response): Promise<void> {
    try {
      const chatService = langChainServiceFactory.getChatService();
      const providersInfo = chatService.getAvailableProviders();

      const seen = new Set<string>();
      const models: any[] = [];

      for (const p of providersInfo.providers) {
        if (seen.has(p.name)) continue;
        seen.add(p.name);

        let shortName = p.name;
        let iconType = 'sparkle';
        const lowerName = p.name.toLowerCase();

        if (lowerName.includes('gemini')) {
          shortName = 'Gemini';
          iconType = 'gemini';
        } else if (lowerName.includes('openai chatgpt')) {
          shortName = 'ChatGPT';
          iconType = 'openai';
        } else if (lowerName.includes('openai compatible')) {
          shortName = p.model ? (p.model.includes('/') ? p.model.split('/').pop() : p.model) : 'Claude / OpenAI';
          iconType = 'claude';
        } else if (lowerName.includes('ollama')) {
          shortName = p.model || 'Ollama';
          iconType = 'ollama';
        }

        models.push({
          id: p.name,
          name: p.name,
          model: p.model || '',
          shortName,
          iconType,
          supportsVision: p.supportsVision,
          priority: p.priority,
        });
      }

      res.json({
        success: true,
        data: {
          models,
          defaultModel: models[0]?.id || null,
        },
      });
    } catch (err: any) {
      logger.error('Error fetching available models:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async processCommand(req: Request, res: Response): Promise<void> {
    try {
      const { text, provider } = req.body;
      if (!text) {
        res.status(400).json({ success: false, error: 'Text is required' });
        return;
      }

      const wantStreaming = req.query.stream === 'true' || req.headers.accept?.includes('text/event-stream');

      if (wantStreaming) {
        setupSSEHeaders(res);

        let graphResult: any = { intent: null, result: null, context: [] };

        const streamIter = dashboardIntentGraph.streamInput(text, provider);

        for await (const chunk of streamIter) {
          if (chunk.classifyIntent) {
            graphResult.intent = chunk.classifyIntent.intent;
            res.write(`data: ${JSON.stringify({ type: 'intent', intent: graphResult.intent })}\n\n`);
          }
          if (chunk.handleQuery) {
            graphResult.result = chunk.handleQuery.result;
            graphResult.context = chunk.handleQuery.context;
          }
          if (chunk.handleReminder) {
            graphResult.result = chunk.handleReminder.result;
          }
          if (chunk.handleTodo) {
            graphResult.result = chunk.handleTodo.result;
          }
          if (chunk.handleNote) {
            graphResult.result = chunk.handleNote.result;
          }
        }

        const chatService = langChainServiceFactory.getChatService();
        const selectedModel = provider
          ? chatService.getProviderByName(provider) || chatService.getBestChatModel()
          : chatService.getBestChatModel();

        if (graphResult.intent === 'query') {
          const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant. Answer the user's query based on the following context retrieved from their knowledge base.
If the context doesn't contain the answer, you can use your general knowledge, but prioritize the context.

Context:
{context}

User Query: {query}
          `);

          const chain = prompt.pipe(selectedModel.model);
          const stream = await chain.stream({
            context: graphResult.context,
            query: text,
          });

          for await (const chunk of stream) {
            const content = (chunk as any).content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
            }
          }

          res.write(
            `data: ${JSON.stringify({
              type: 'done',
              result: { type: 'query_answered' },
              provider: selectedModel.name,
            })}\n\n`
          );
          res.end();
        } else {
          res.write(
            `data: ${JSON.stringify({
              type: 'done',
              result: graphResult.result,
              provider: selectedModel.name,
            })}\n\n`
          );
          res.end();
        }
      } else {
        const graphResult = await dashboardIntentGraph.processInput(text, provider);
        const chatService = langChainServiceFactory.getChatService();
        const selectedModel = provider
          ? chatService.getProviderByName(provider) || chatService.getBestChatModel()
          : chatService.getBestChatModel();

        if (graphResult.intent === 'query') {
          const prompt = PromptTemplate.fromTemplate(
            `You are a helpful AI assistant. Answer the user's query based on the following context retrieved from their knowledge base. If the context doesn't contain the answer, use your general knowledge. Context: {context} \n User Query: {query}`
          );
          const chain = prompt.pipe(selectedModel.model);
          const response = await chain.invoke({ context: graphResult.context, query: text });

          res.json({
            success: true,
            data: {
              intent: graphResult.intent,
              result: { type: 'query_answered', answer: (response as any).content },
              provider: selectedModel.name,
            },
          });
          return;
        }

        res.json({
          success: true,
          data: {
            intent: graphResult.intent,
            result: graphResult.result,
            provider: selectedModel.name,
          },
        });
      }
    } catch (err: any) {
      logger.error('Error processing command:', err);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  }

  async getTodos(req: Request, res: Response): Promise<void> {
    try {
      const todos = await todoDbService.getTodos();
      res.json({ success: true, data: todos });
    } catch (err: any) {
      logger.error('Error fetching todos:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createTodo(req: Request, res: Response): Promise<void> {
    try {
      const { text, isAiPrompt } = req.body;
      let todoData = req.body;
      if (isAiPrompt && text) {
        todoData = await dashboardLangGraphService.processNaturalLanguageTodo(text);
      } else if (!todoData.title && text) {
        todoData = { ...todoData, title: text };
      }
      const newTodo = await todoDbService.addTodo(todoData);
      res.status(201).json({ success: true, data: newTodo });
    } catch (err: any) {
      logger.error('Error creating todo:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateTodo(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updatedTodo = await todoDbService.updateTodo(id, req.body);
      res.json({ success: true, data: updatedTodo });
    } catch (err: any) {
      logger.error('Error updating todo:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteTodo(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await todoDbService.deleteTodo(id);
      res.json({ success: true });
    } catch (err: any) {
      logger.error('Error deleting todo:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async reorderTodos(req: Request, res: Response): Promise<void> {
    try {
      const { orderedIds } = req.body;
      const todos = await todoDbService.reorderTodos(orderedIds);
      res.json({ success: true, data: todos });
    } catch (err: any) {
      logger.error('Error reordering todos:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getReminders(req: Request, res: Response): Promise<void> {
    try {
      const reminders = await reminderDbService.getReminders();
      res.json({ success: true, data: reminders });
    } catch (err: any) {
      logger.error('Error fetching reminders:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createReminder(req: Request, res: Response): Promise<void> {
    try {
      const newReminder = await reminderDbService.addReminder(req.body);
      res.status(201).json({ success: true, data: newReminder });
    } catch (err: any) {
      logger.error('Error creating reminder:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateReminder(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updatedReminder = await reminderDbService.updateReminder(id, req.body);
      res.json({ success: true, data: updatedReminder });
    } catch (err: any) {
      logger.error('Error updating reminder:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteReminder(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await reminderDbService.deleteReminder(id);
      res.json({ success: true });
    } catch (err: any) {
      logger.error('Error deleting reminder:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getNotes(req: Request, res: Response): Promise<void> {
    try {
      const notes = await noteDbService.getNotes();
      res.json({ success: true, data: notes });
    } catch (err: any) {
      logger.error('Error fetching notes:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getNoteById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const note = await noteDbService.getNoteById(id);
      res.json({ success: true, data: note });
    } catch (err: any) {
      logger.error('Error fetching note by id:', err);
      res.status(404).json({ success: false, error: err.message });
    }
  }

  async createNote(req: Request, res: Response): Promise<void> {
    try {
      const newNote = await noteDbService.addNote(req.body);
      res.status(201).json({ success: true, data: newNote });
    } catch (err: any) {
      logger.error('Error creating note:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateNote(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updatedNote = await noteDbService.updateNote(id, req.body);
      res.json({ success: true, data: updatedNote });
    } catch (err: any) {
      logger.error('Error updating note:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async toggleNotePin(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updatedNote = await noteDbService.togglePin(id);
      res.json({ success: true, data: updatedNote });
    } catch (err: any) {
      logger.error('Error toggling note pin:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async toggleNoteFavorite(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updatedNote = await noteDbService.toggleFavorite(id);
      res.json({ success: true, data: updatedNote });
    } catch (err: any) {
      logger.error('Error toggling note favorite:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteNote(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await noteDbService.deleteNote(id);
      res.json({ success: true });
    } catch (err: any) {
      logger.error('Error deleting note:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async summarizeNote(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { prompt } = req.body || {};
      const result = await noteAiService.summarizeNote(id, prompt);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error summarizing note:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async autoTagNote(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const result = await noteAiService.autoTagNote(id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error auto-tagging note:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async expandNote(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { instruction } = req.body || {};
      const result = await noteAiService.expandNote(id, instruction);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error expanding note:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async generateNote(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, autoSave = false } = req.body || {};
      if (!prompt) {
        res.status(400).json({ success: false, error: 'Prompt is required' });
        return;
      }
      const result = await noteAiService.generateFromPrompt(prompt, autoSave);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error generating note:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async suggestRelatedNotes(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const limit = parseInt((req.query.limit as string) || '5', 10);
      const result = await noteAiService.suggestRelated(id, limit);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error finding related notes:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async improveWriting(req: Request, res: Response): Promise<void> {
    try {
      const { text, mode = 'improve' } = req.body || {};
      if (!text) {
        res.status(400).json({ success: false, error: 'Text is required' });
        return;
      }
      const result = await noteAiService.improveWriting(text, mode);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error improving writing:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getTileConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await tileConfigDbService.getConfig();
      res.json({ success: true, data: config });
    } catch (err: any) {
      logger.error('Error fetching tile config:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateTileConfig(req: Request, res: Response): Promise<void> {
    try {
      const updatedConfig = await tileConfigDbService.updateConfig(req.body);
      res.json({ success: true, data: updatedConfig });
    } catch (err: any) {
      logger.error('Error updating tile config:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async runSummarize(req: Request, res: Response): Promise<void> {
    try {
      const { text } = req.body;
      if (!text) {
        res.status(400).json({ success: false, error: 'Text is required' });
        return;
      }
      const result = await dashboardLangGraphService.runSummarizeGraph(text);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error summarizing:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async searchSummaries(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit = 5 } = req.body;
      const results = await memoryService.searchMemory(query, limit);
      const formatted = results.map((r: any) => ({
        id: r.metadata.id,
        sourceId: r.metadata.sourceId || r.metadata.id,
        title: r.metadata.title || '',
        text: r.pageContent,
        summary: r.metadata.summary || '',
        tags: r.metadata.tags || [],
        type: r.metadata.type || 'note',
      }));
      res.json({ success: true, data: formatted });
    } catch (err: any) {
      logger.error('Error searching summaries:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { status, type, limit } = req.query;
      const options: any = {};
      if (status) options.status = status as string;
      if (type) options.type = type as string;
      if (limit) options.limit = parseInt(limit as string, 10);

      const notifications = await notificationDbService.getNotifications(options);
      const unreadCount = await notificationDbService.getUnreadCount();

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (err: any) {
      logger.error('Error fetching notifications:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getUnreadNotificationCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await notificationDbService.getUnreadCount();
      res.json({ success: true, data: { unreadCount: count } });
    } catch (err: any) {
      logger.error('Error fetching unread notification count:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async markNotificationRead(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await notificationDbService.markAsRead(id);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('Error marking notification as read:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async markAllNotificationsRead(req: Request, res: Response): Promise<void> {
    try {
      await notificationDbService.markAllAsRead();
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err: any) {
      logger.error('Error marking all notifications as read:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await notificationDbService.deleteNotification(id);
      res.json({ success: true, message: 'Notification deleted' });
    } catch (err: any) {
      logger.error('Error deleting notification:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async clearAllNotifications(req: Request, res: Response): Promise<void> {
    try {
      await notificationDbService.clearAllNotifications();
      res.json({ success: true, message: 'All notifications cleared' });
    } catch (err: any) {
      logger.error('Error clearing all notifications:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async triggerTestNotification(req: Request, res: Response): Promise<void> {
    try {
      const { title, message, type, severity } = req.body;
      const notification = await dashboardNotificationService.triggerManualNotification({
        title: title || '🧪 Test Notification',
        message: message || 'Server-driven test notification delivered successfully!',
        type: type || 'system',
        severity: severity || 'info',
        metadata: { source: 'test-endpoint', triggeredAt: new Date().toISOString() },
      });
      res.status(201).json({ success: true, data: notification });
    } catch (err: any) {
      logger.error('Error triggering test notification:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getLanceDbStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await lanceDbService.getStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      logger.error('Error fetching LanceDB stats:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getLanceDbTableRecords(req: Request, res: Response): Promise<void> {
    try {
      const tableName = String(req.params.tableName || 'summaries');
      const { limit = 50, offset = 0, type, search } = req.query;
      const result = await lanceDbService.getTableRecords(tableName, {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        type: type as string,
        search: search as string,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error fetching LanceDB records:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getLanceDbTableSchema(req: Request, res: Response): Promise<void> {
    try {
      const tableName = String(req.params.tableName || 'summaries');
      const schema = await lanceDbService.getTableSchema(tableName);
      res.json({ success: true, data: schema });
    } catch (err: any) {
      logger.error('Error fetching LanceDB schema:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteLanceDbRecord(req: Request, res: Response): Promise<void> {
    try {
      const tableName = String(req.params.tableName || 'summaries');
      const id = String(req.params.id);
      const result = await lanceDbService.deleteRecord(tableName, id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error deleting LanceDB record:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async bulkDeleteLanceDbRecords(req: Request, res: Response): Promise<void> {
    try {
      const tableName = String(req.params.tableName || 'summaries');
      const { ids = [], deleteAll = false, type = null } = req.body || {};
      const result = await lanceDbService.deleteRecords(tableName, ids, { deleteAll, type });
      res.json({ success: true, data: result, message: `Deleted ${result.count} record(s)` });
    } catch (err: any) {
      logger.error('Error bulk deleting LanceDB records:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async insertLanceDbRecord(req: Request, res: Response): Promise<void> {
    try {
      const { text, type = 'general', tags = [], summary = '', sourceId = '' } = req.body;
      if (!text || !text.trim()) {
        res.status(400).json({ success: false, error: 'Text content is required' });
        return;
      }
      const id = await memoryService.addMemory(text.trim(), {
        type,
        tags: Array.isArray(tags) ? tags : [tags],
        summary,
        sourceId,
      });
      res.status(201).json({ success: true, data: { id, text, type, tags, summary, sourceId } });
    } catch (err: any) {
      logger.error('Error inserting LanceDB record:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async reindexNotesToLanceDb(req: Request, res: Response): Promise<void> {
    try {
      await noteDbService.reindexAllNotes();
      const stats = await lanceDbService.getStats();
      res.json({ success: true, message: 'All notes re-indexed into LanceDB', data: stats });
    } catch (err: any) {
      logger.error('Error reindexing notes to LanceDB:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async searchLanceDb(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit = 5, tableName = 'summaries' } = req.body;
      if (!query || !query.trim()) {
        res.status(400).json({ success: false, error: 'Query is required' });
        return;
      }
      const { results, durationMs } = await memoryService.searchMemoryWithScore(
        query,
        parseInt(limit, 10),
        tableName
      );

      const formatted = results.map(([doc, distance]: any) => {
        const rawDistance = typeof distance === 'number' ? distance : doc.metadata?._distance || 0;
        const similarityScore = Math.max(0, Math.min(100, Math.round((1 - rawDistance / 2) * 100)));

        return {
          id: doc.metadata?.id || '',
          sourceId: doc.metadata?.sourceId || '',
          type: doc.metadata?.type || 'note',
          summary: doc.metadata?.summary || '',
          tags: Array.isArray(doc.metadata?.tags) ? doc.metadata.tags : [],
          text: doc.pageContent || '',
          distance: Number(rawDistance.toFixed(4)),
          similarityScore,
        };
      });

      res.json({
        success: true,
        data: {
          query,
          count: formatted.length,
          durationMs,
          results: formatted,
        },
      });
    } catch (err: any) {
      logger.error('Error searching LanceDB:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getLanceDbDiagnostics(req: Request, res: Response): Promise<void> {
    try {
      const diagnostics = await lanceDbService.runDiagnostics();
      res.json({ success: true, data: diagnostics });
    } catch (err: any) {
      logger.error('Error running LanceDB diagnostics:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default new DashboardController();
