import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import logger from '../logger.ts';

export type AppStateData = Record<string, any>;

class AppStateDbService {
  adapter: JSONFile<AppStateData>;
  db: Low<AppStateData>;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    const dbPath = path.join(configDir, 'app-state.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      logger.info(`Created config directory: ${configDir}`);
    }

    this.adapter = new JSONFile<AppStateData>(dbPath);
    this.db = new Low<AppStateData>(this.adapter, {});
    logger.info(`App State database initialized at: ${dbPath}`);
  }

  async init(): Promise<boolean> {
    try {
      await this.db.read();

      if (!this.db.data) {
        this.db.data = {};
        await this.db.write();
        logger.info('App State database initialized with empty state');
      }

      return true;
    } catch (error: any) {
      logger.error('Failed to initialize app state database:', error);
      throw error;
    }
  }

  async getState<T = any>(key: string): Promise<T | null> {
    try {
      await this.db.read();
      return (this.db.data?.[key] as T) || null;
    } catch (error: any) {
      logger.error(`Failed to get app state for key ${key}:`, error);
      throw error;
    }
  }

  async setState<T = any>(key: string, value: T): Promise<T> {
    try {
      await this.db.read();

      if (!this.db.data) {
        this.db.data = {};
      }

      this.db.data[key] = value;
      await this.db.write();

      logger.info(`Updated app state for key: ${key}`);
      return this.db.data[key];
    } catch (error: any) {
      logger.error(`Failed to set app state for key ${key}:`, error);
      throw error;
    }
  }

  async deleteState(key: string): Promise<boolean> {
    try {
      await this.db.read();

      if (this.db.data && this.db.data[key] !== undefined) {
        delete this.db.data[key];
        await this.db.write();
        logger.info(`Deleted app state for key: ${key}`);
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error(`Failed to delete app state for key ${key}:`, error);
      throw error;
    }
  }
}

const appStateDbService = new AppStateDbService();

appStateDbService.init().catch(err => {
  logger.error('Failed to initialize App State DB on startup:', err);
});

export default appStateDbService;
