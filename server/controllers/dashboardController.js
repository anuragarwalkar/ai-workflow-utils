import todoDbService from '../services/dashboard/TodoDbService.js';
import dashboardLangGraphService from '../services/dashboard/DashboardLangGraphService.js';
import memoryService from '../services/dashboard/MemoryService.js';
import reminderDbService from '../services/dashboard/ReminderDbService.js';
import noteDbService from '../services/dashboard/NoteDbService.js';
import tileConfigDbService from '../services/dashboard/TileConfigDbService.js';
import dashboardIntentGraph from '../services/dashboard/DashboardIntentGraph.js';
import langChainServiceFactory from '../services/langchain/LangChainServiceFactory.js';
import { setupSSEHeaders } from './chat/processors/streaming-processor.js';
import { PromptTemplate } from '@langchain/core/prompts';
import logger from '../logger.js';

class DashboardController {
  // Command Bar
  async processCommand(req, res) {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, error: 'Text is required' });
      }

      // If they requested streaming via a header or param, handle it
      const wantStreaming = req.query.stream === 'true' || req.headers.accept?.includes('text/event-stream');

      if (wantStreaming) {
        setupSSEHeaders(res);
        
        let graphResult = { intent: null, result: null, context: [] };
        
        // 1. Process intent as a stream so we can intercept the classification early
        const streamIter = dashboardIntentGraph.streamInput(text);
        
        for await (const chunk of streamIter) {
          if (chunk.classifyIntent) {
            graphResult.intent = chunk.classifyIntent.intent;
            // Send intent early so UI can show it immediately
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

        if (graphResult.intent === 'query') {
          // Stream the query response
          const chatService = langChainServiceFactory.getChatService();
          const bestModel = chatService.getBestChatModel();
          
          const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant. Answer the user's query based on the following context retrieved from their knowledge base.
If the context doesn't contain the answer, you can use your general knowledge, but prioritize the context.

Context:
{context}

User Query: {query}
          `);

          const chain = prompt.pipe(bestModel.model);
          const stream = await chain.stream({
            context: graphResult.context,
            query: text,
          });

          for await (const chunk of stream) {
            const content = chunk.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
            }
          }
          
          res.write(`data: ${JSON.stringify({ type: 'done', result: { type: 'query_answered' } })}\n\n`);
          res.end();
        } else {
          // For other intents, just send the final result
          res.write(`data: ${JSON.stringify({ type: 'done', result: graphResult.result })}\n\n`);
          res.end();
        }
      } else {
        // Non-streaming fallback
        const graphResult = await dashboardIntentGraph.processInput(text);
        
        if (graphResult.intent === 'query') {
          const chatService = langChainServiceFactory.getChatService();
          const bestModel = chatService.getBestChatModel();
          const prompt = PromptTemplate.fromTemplate(`You are a helpful AI assistant. Answer the user's query based on the following context retrieved from their knowledge base. If the context doesn't contain the answer, use your general knowledge. Context: {context} \n User Query: {query}`);
          const chain = prompt.pipe(bestModel.model);
          const response = await chain.invoke({ context: graphResult.context, query: text });
          
          return res.json({ 
            success: true, 
            data: { 
              intent: graphResult.intent, 
              result: { type: 'query_answered', answer: response.content } 
            } 
          });
        }

        res.json({ success: true, data: { intent: graphResult.intent, result: graphResult.result } });
      }
    } catch (err) {
      logger.error('Error processing command:', err);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  }

  // Todos
  async getTodos(req, res) {
    try {
      const todos = await todoDbService.getTodos();
      res.json({ success: true, data: todos });
    } catch (err) {
      logger.error('Error fetching todos:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createTodo(req, res) {
    try {
      const { text, isAiPrompt } = req.body;
      let todoData = req.body;
      if (isAiPrompt && text) {
        todoData = await dashboardLangGraphService.processNaturalLanguageTodo(text);
      }
      const newTodo = await todoDbService.addTodo(todoData);
      res.status(201).json({ success: true, data: newTodo });
    } catch (err) {
      logger.error('Error creating todo:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateTodo(req, res) {
    try {
      const { id } = req.params;
      const updatedTodo = await todoDbService.updateTodo(id, req.body);
      res.json({ success: true, data: updatedTodo });
    } catch (err) {
      logger.error('Error updating todo:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteTodo(req, res) {
    try {
      const { id } = req.params;
      await todoDbService.deleteTodo(id);
      res.json({ success: true });
    } catch (err) {
      logger.error('Error deleting todo:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Reminders
  async getReminders(req, res) {
    try {
      const reminders = await reminderDbService.getReminders();
      res.json({ success: true, data: reminders });
    } catch (err) {
      logger.error('Error fetching reminders:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createReminder(req, res) {
    try {
      const newReminder = await reminderDbService.addReminder(req.body);
      res.status(201).json({ success: true, data: newReminder });
    } catch (err) {
      logger.error('Error creating reminder:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateReminder(req, res) {
    try {
      const { id } = req.params;
      const updatedReminder = await reminderDbService.updateReminder(id, req.body);
      res.json({ success: true, data: updatedReminder });
    } catch (err) {
      logger.error('Error updating reminder:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteReminder(req, res) {
    try {
      const { id } = req.params;
      await reminderDbService.deleteReminder(id);
      res.json({ success: true });
    } catch (err) {
      logger.error('Error deleting reminder:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Notes
  async getNotes(req, res) {
    try {
      const notes = await noteDbService.getNotes();
      res.json({ success: true, data: notes });
    } catch (err) {
      logger.error('Error fetching notes:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createNote(req, res) {
    try {
      const newNote = await noteDbService.addNote(req.body);
      res.status(201).json({ success: true, data: newNote });
    } catch (err) {
      logger.error('Error creating note:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateNote(req, res) {
    try {
      const { id } = req.params;
      const updatedNote = await noteDbService.updateNote(id, req.body);
      res.json({ success: true, data: updatedNote });
    } catch (err) {
      logger.error('Error updating note:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteNote(req, res) {
    try {
      const { id } = req.params;
      await noteDbService.deleteNote(id);
      res.json({ success: true });
    } catch (err) {
      logger.error('Error deleting note:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Tile Config
  async getTileConfig(req, res) {
    try {
      const config = await tileConfigDbService.getConfig();
      res.json({ success: true, data: config });
    } catch (err) {
      logger.error('Error fetching tile config:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateTileConfig(req, res) {
    try {
      const updatedConfig = await tileConfigDbService.updateConfig(req.body);
      res.json({ success: true, data: updatedConfig });
    } catch (err) {
      logger.error('Error updating tile config:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Summaries & Knowledge Dump
  async runSummarize(req, res) {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, error: 'Text is required' });
      }
      const result = await dashboardLangGraphService.runSummarizeGraph(text);
      res.json({ success: true, data: result });
    } catch (err) {
      logger.error('Error summarizing:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async searchSummaries(req, res) {
    try {
      const { query, limit = 5 } = req.body;
      const results = await memoryService.searchMemory(query, limit);
      const formatted = results.map(r => ({
        id: r.metadata.id,
        text: r.pageContent,
        summary: r.metadata.summary,
        type: r.metadata.type,
      }));
      res.json({ success: true, data: formatted });
    } catch (err) {
      logger.error('Error searching summaries:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default new DashboardController();
