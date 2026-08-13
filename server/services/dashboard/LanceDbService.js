import { connect } from '@lancedb/lancedb';
import os from 'os';
import path from 'path';
import fs from 'fs';
import logger from '../../logger.js';

class LanceDbService {
  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    this.dbPath = path.join(configDir, 'lancedb');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      logger.info(`Created config directory: ${configDir}`);
    }
    
    this.db = null;
  }

  async init() {
    if (!this.db) {
      try {
        this.db = await connect(this.dbPath);
        logger.info(`LanceDB initialized at: ${this.dbPath}`);
      } catch (error) {
        logger.error('Failed to initialize LanceDB:', error);
        throw error;
      }
    }
    return this.db;
  }

  async getTable(tableName, vectorSize = 1536) {
    await this.init();
    try {
      const tables = await this.db.tableNames();
      if (tables.includes(tableName)) {
        return await this.db.openTable(tableName);
      }
      
      const initialData = [{
        vector: Array(vectorSize).fill(0),
        text: "init",
        id: "init",
        type: "init",
        sourceId: "init",
        summary: "init",
        tags: ["init"]
      }];
      
      const table = await this.db.createTable(tableName, initialData);
      
      await table.delete("id = 'init'");
      
      return table;
    } catch (error) {
      logger.error(`Failed to get/create table ${tableName}:`, error);
      throw error;
    }
  }

  async getSummariesTable() {
    return this.getTable('summaries');
  }
}

export default new LanceDbService();
