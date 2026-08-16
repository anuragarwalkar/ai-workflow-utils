import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger.js';
import memoryService from './MemoryService.js';

class TodoDbService {
  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    const dbPath = path.join(configDir, 'todos.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    this.adapter = new JSONFile(dbPath);
    this.db = new Low(this.adapter, { todos: [] });
  }

  async init() {
    await this.db.read();
    if (!this.db.data) {
      this.db.data = { todos: [] };
      await this.db.write();
    }
  }

  async getTodos() {
    await this.init();
    return this.db.data.todos || [];
  }

  async indexTodoInLanceDb(todo) {
    if (!todo || !todo.title) return;
    try {
      // First delete existing vector for this sourceId (if any)
      await memoryService.deleteMemoryBySourceId(todo.id);

      const statusStr = todo.done ? 'Completed' : 'Pending';
      const priorityStr = todo.priority || 'Medium';
      const dueStr = todo.dueAt ? ` (Due: ${todo.dueAt})` : '';

      // High quality semantic text for vector embedding search
      const textToIndex = `Task / To-Do: ${todo.title}\nStatus: ${statusStr}\nPriority: ${priorityStr}${dueStr}`;

      const tags = ['todo', 'task', priorityStr.toLowerCase(), statusStr.toLowerCase()];
      if (Array.isArray(todo.tags)) {
        tags.push(...todo.tags);
      }

      const metadata = {
        type: 'todo',
        sourceId: todo.id,
        summary: `Task: ${todo.title} [${statusStr} - ${priorityStr} Priority]`,
        tags: Array.from(new Set(tags)),
        title: todo.title,
        status: statusStr,
        priority: priorityStr,
        dueAt: todo.dueAt || null
      };

      const lanceDbId = await memoryService.addMemory(textToIndex, metadata);

      // Update LowDB record with isIndexed and lanceDbId if found
      const index = (this.db.data?.todos || []).findIndex(t => t.id === todo.id);
      if (index !== -1) {
        this.db.data.todos[index].isIndexed = true;
        this.db.data.todos[index].lanceDbId = lanceDbId;
        await this.db.write();
      }
      logger.info(`Indexed task into LanceDB: ${todo.id} ("${todo.title}")`);
    } catch (err) {
      logger.error(`Failed to index task ${todo.id} in LanceDB:`, err);
    }
  }

  async addTodo(todoData) {
    await this.init();
    const newTodo = {
      id: uuidv4(),
      title: todoData.title || todoData.text || 'Untitled Task',
      dueAt: todoData.dueAt || null,
      priority: todoData.priority || 'Medium',
      done: false,
      notifyAt: todoData.notifyAt || null,
      isIndexed: false,
      lanceDbId: null,
      createdAt: new Date().toISOString(),
      ...todoData
    };
    
    this.db.data.todos.push(newTodo);
    await this.db.write();
    logger.info(`Added new TODO: ${newTodo.id}`);

    // Asynchronously index in LanceDB without blocking the API response (ASAP response)
    this.indexTodoInLanceDb(newTodo).catch(err => {
      logger.error(`Failed to index new TODO ${newTodo.id} in LanceDB:`, err);
    });

    return newTodo;
  }

  async updateTodo(id, patch) {
    await this.init();
    const index = this.db.data.todos.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Todo with id ${id} not found`);
    }

    this.db.data.todos[index] = {
      ...this.db.data.todos[index],
      ...patch,
      updatedAt: new Date().toISOString()
    };
    
    await this.db.write();
    const updatedTodo = this.db.data.todos[index];

    // Asynchronously update / re-index in LanceDB
    this.indexTodoInLanceDb(updatedTodo).catch(err => {
      logger.error(`Failed to update TODO ${id} in LanceDB:`, err);
    });

    return updatedTodo;
  }

  async deleteTodo(id) {
    await this.init();
    const initialLength = this.db.data.todos.length;
    this.db.data.todos = this.db.data.todos.filter(t => t.id !== id);
    
    if (this.db.data.todos.length !== initialLength) {
      await this.db.write();
      
      // Asynchronously delete vector record from LanceDB
      memoryService.deleteMemoryBySourceId(id).catch(err => {
        logger.error(`Failed to delete TODO ${id} from LanceDB:`, err);
      });

      return true;
    }
    return false;
  }

  async reorderTodos(orderedIds) {
    await this.init();
    if (!Array.isArray(orderedIds)) {
      throw new Error('orderedIds must be an array');
    }
    const todoMap = new Map((this.db.data.todos || []).map(t => [t.id, t]));
    const reordered = [];
    for (const id of orderedIds) {
      if (todoMap.has(id)) {
        reordered.push(todoMap.get(id));
        todoMap.delete(id);
      }
    }
    for (const rem of todoMap.values()) {
      reordered.push(rem);
    }
    this.db.data.todos = reordered;
    await this.db.write();
    logger.info('Reordered todos successfully');
    return this.db.data.todos;
  }

  async reindexAllTodos() {
    await this.init();
    logger.info('Starting full re-indexing of all tasks into LanceDB...');
    const todos = this.db.data.todos || [];
    for (const todo of todos) {
      await this.indexTodoInLanceDb(todo);
    }
    logger.info(`Finished full re-indexing of ${todos.length} tasks into LanceDB.`);
  }
}

export default new TodoDbService();
