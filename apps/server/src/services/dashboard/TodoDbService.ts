import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger.ts';
import memoryService from './MemoryService.ts';

export interface TodoData {
  id: string;
  title: string;
  dueAt?: string | null;
  priority?: string;
  done: boolean;
  notifyAt?: string | null;
  isIndexed?: boolean;
  lanceDbId?: string | null;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  [key: string]: any;
}

export interface TodoDbSchema {
  todos: TodoData[];
}

const PRIORITY_ORDER: Record<string, number> = {
  high: 1,
  medium: 2,
  med: 2,
  low: 3,
};

const getPriorityRank = (priority?: string): number => {
  const p = (priority || '').toLowerCase();
  return PRIORITY_ORDER[p] || 2;
};

const sortTodoList = (todos: TodoData[]): TodoData[] => {
  if (!Array.isArray(todos)) return [];
  const pending = todos.filter(t => !t.done);
  const completed = todos.filter(t => Boolean(t.done));

  pending.sort((a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority));
  completed.sort((a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority));

  return [...pending, ...completed];
};

class TodoDbService {
  adapter: JSONFile<TodoDbSchema>;
  db: Low<TodoDbSchema>;
  private _queue: Promise<any>;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    const dbPath = path.join(configDir, 'todos.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    this.adapter = new JSONFile<TodoDbSchema>(dbPath);
    this.db = new Low<TodoDbSchema>(this.adapter, { todos: [] });
    this._queue = Promise.resolve();
  }

  async _withLock<T>(fn: () => Promise<T>): Promise<T> {
    const prevQueue = this._queue;
    let resolveLock!: () => void;
    this._queue = new Promise<void>(resolve => {
      resolveLock = resolve;
    });
    await prevQueue;
    try {
      return await fn();
    } finally {
      resolveLock();
    }
  }

  async init(): Promise<void> {
    await this.db.read();
    if (!this.db.data) {
      this.db.data = { todos: [] };
      await this.db.write();
    }
  }

  async getTodos(): Promise<TodoData[]> {
    return this._withLock(async () => {
      await this.init();
      return sortTodoList(this.db.data.todos || []);
    });
  }

  async indexTodoInLanceDb(todo: TodoData): Promise<void> {
    if (!todo || !todo.title) return;
    try {
      await memoryService.deleteMemoryBySourceId(todo.id);

      const statusStr = todo.done ? 'Completed' : 'Pending';
      const priorityStr = todo.priority || 'Medium';
      const dueStr = todo.dueAt ? ` (Due: ${todo.dueAt})` : '';

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
        dueAt: todo.dueAt || null,
      };

      const lanceDbId = await memoryService.addMemory(textToIndex, metadata);

      await this._withLock(async () => {
        const index = (this.db.data?.todos || []).findIndex(t => t.id === todo.id);
        if (index !== -1) {
          this.db.data.todos[index].isIndexed = true;
          this.db.data.todos[index].lanceDbId = lanceDbId;
          await this.db.write();
        }
      });
      logger.info(`Indexed task into LanceDB: ${todo.id} ("${todo.title}")`);
    } catch (err: any) {
      logger.error(`Failed to index task ${todo.id} in LanceDB:`, err);
    }
  }

  async addTodo(todoData: Partial<TodoData>): Promise<TodoData> {
    return this._withLock(async () => {
      await this.init();
      const newTodo: TodoData = {
        id: uuidv4(),
        title: todoData.title || (todoData as any).text || 'Untitled Task',
        dueAt: todoData.dueAt || null,
        priority: todoData.priority || 'Medium',
        done: false,
        notifyAt: todoData.notifyAt || null,
        isIndexed: false,
        lanceDbId: null,
        createdAt: new Date().toISOString(),
        ...todoData,
      };
      newTodo.done = Boolean(newTodo.done);

      this.db.data.todos = sortTodoList([...(this.db.data.todos || []), newTodo]);
      await this.db.write();
      logger.info(`Added new TODO: ${newTodo.id}`);

      this.indexTodoInLanceDb(newTodo).catch(err => {
        logger.error(`Failed to index new TODO ${newTodo.id} in LanceDB:`, err);
      });

      return newTodo;
    });
  }

  async updateTodo(id: string, patch: Partial<TodoData>): Promise<TodoData> {
    return this._withLock(async () => {
      await this.init();
      const index = this.db.data.todos.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error(`Todo with id ${id} not found`);
      }

      const updatedFields: any = { ...patch };
      if (updatedFields.done !== undefined) {
        updatedFields.done = Boolean(updatedFields.done);
      }

      this.db.data.todos[index] = {
        ...this.db.data.todos[index],
        ...updatedFields,
        updatedAt: new Date().toISOString(),
      };

      this.db.data.todos = sortTodoList(this.db.data.todos || []);

      await this.db.write();
      const updatedTodo = this.db.data.todos.find(t => t.id === id) || this.db.data.todos[index];

      this.indexTodoInLanceDb(updatedTodo).catch(err => {
        logger.error(`Failed to update TODO ${id} in LanceDB:`, err);
      });

      return updatedTodo;
    });
  }

  async deleteTodo(id: string): Promise<boolean> {
    return this._withLock(async () => {
      await this.init();
      const initialLength = this.db.data.todos.length;
      this.db.data.todos = this.db.data.todos.filter(t => t.id !== id);

      if (this.db.data.todos.length !== initialLength) {
        await this.db.write();

        memoryService.deleteMemoryBySourceId(id).catch(err => {
          logger.error(`Failed to delete TODO ${id} from LanceDB:`, err);
        });

        return true;
      }
      return false;
    });
  }

  async reorderTodos(orderedIds: string[]): Promise<TodoData[]> {
    return this._withLock(async () => {
      await this.init();
      if (!Array.isArray(orderedIds)) {
        throw new Error('orderedIds must be an array');
      }
      const todoMap = new Map((this.db.data.todos || []).map(t => [t.id, t]));
      const reordered: TodoData[] = [];
      for (const id of orderedIds) {
        if (todoMap.has(id)) {
          reordered.push(todoMap.get(id)!);
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
    });
  }

  async reindexAllTodos(): Promise<void> {
    return this._withLock(async () => {
      await this.init();
      logger.info('Starting full re-indexing of all tasks into LanceDB...');
      const todos = this.db.data.todos || [];
      for (const todo of todos) {
        await this.indexTodoInLanceDb(todo);
      }
      logger.info(`Finished full re-indexing of ${todos.length} tasks into LanceDB.`);
    });
  }
}

export default new TodoDbService();
