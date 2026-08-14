import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger.js';

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

  async addTodo(todoData) {
    await this.init();
    const newTodo = {
      id: uuidv4(),
      title: todoData.title,
      dueAt: todoData.dueAt || null,
      priority: todoData.priority || 'Medium',
      done: false,
      notifyAt: todoData.notifyAt || null,
      createdAt: new Date().toISOString(),
      ...todoData
    };
    
    this.db.data.todos.push(newTodo);
    await this.db.write();
    logger.info(`Added new TODO: ${newTodo.id}`);
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
    return this.db.data.todos[index];
  }

  async deleteTodo(id) {
    await this.init();
    const initialLength = this.db.data.todos.length;
    this.db.data.todos = this.db.data.todos.filter(t => t.id !== id);
    
    if (this.db.data.todos.length !== initialLength) {
      await this.db.write();
      return true;
    }
    return false;
  }
}

export default new TodoDbService();
