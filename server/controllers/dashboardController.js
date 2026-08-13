import slackService from '../services/dashboard/SlackService.js';
import todoDbService from '../services/dashboard/TodoDbService.js';
import dashboardLangGraphService from '../services/dashboard/DashboardLangGraphService.js';
import memoryService from '../services/dashboard/MemoryService.js';
import logger from '../logger.js';

class DashboardController {
  // Slack
  async getSlackItems(req, res) {
    try {
      const items = await slackService.getAssignedItems();
      res.json({ success: true, data: items });
    } catch (err) {
      logger.error('Error fetching slack items:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getSlackChannels(req, res) {
    try {
      const channels = await slackService.getChannels();
      res.json({ success: true, data: channels });
    } catch (err) {
      logger.error('Error fetching slack channels:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async testSlackConnection(req, res) {
    try {
      const isConnected = await slackService.testConnection();
      res.json({ success: true, connected: isConnected });
    } catch (err) {
      res.json({ success: false, connected: false, error: err.message });
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
        // Parse with AI
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
      // Map back to a clean array of objects
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
