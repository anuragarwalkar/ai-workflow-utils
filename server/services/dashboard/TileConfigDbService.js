import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import logger from '../../logger.js';

const DEFAULT_TILES = [
  { id: 'contextStream', label: 'Context Stream (LanceDB)', visible: true, order: 0 },
  { id: 'reminders', label: 'Reminders', visible: true, order: 1 },
  { id: 'todos', label: 'To-Dos', visible: true, order: 2 },
  { id: 'slackOverview', label: 'Slack Overview', visible: false, order: 3 },
  { id: 'knowledgeBase', label: 'Knowledge Base & RAG', visible: false, order: 4 },
  { id: 'prReviews', label: 'PR Reviews', visible: false, order: 5 },
  { id: 'taskTimeline', label: 'Task Timeline', visible: false, order: 6 },
  { id: 'performanceMetrics', label: 'Performance Metrics', visible: false, order: 7 }
];

class TileConfigDbService {
  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    const dbPath = path.join(configDir, 'tile-config.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    this.adapter = new JSONFile(dbPath);
    this.db = new Low(this.adapter, { tiles: DEFAULT_TILES });
  }

  async init() {
    await this.db.read();
    if (!this.db.data || !this.db.data.tiles || this.db.data.tiles.length === 0) {
      this.db.data = { tiles: DEFAULT_TILES };
      await this.db.write();
    } else {
      // Merge new default tiles if they don't exist in the current config
      let updated = false;
      DEFAULT_TILES.forEach(defaultTile => {
        if (!this.db.data.tiles.find(t => t.id === defaultTile.id)) {
          this.db.data.tiles.push(defaultTile);
          updated = true;
        }
      });
      if (updated) {
        await this.db.write();
      }
    }
  }

  async getConfig() {
    await this.init();
    return this.db.data.tiles;
  }

  async updateConfig(tilesArray) {
    await this.init();
    
    // Ensure all tiles are valid IDs
    const validIds = DEFAULT_TILES.map(t => t.id);
    const validTiles = tilesArray.filter(t => validIds.includes(t.id));
    
    if (validTiles.length === 0) {
      throw new Error('Invalid tile configuration provided');
    }

    this.db.data.tiles = validTiles;
    await this.db.write();
    logger.info('Updated dashboard tile configuration');
    return this.db.data.tiles;
  }
}

export default new TileConfigDbService();
