import appStateDbService from '../appStateDbService.js';
import logger from '../../logger.js';

const DEFAULT_TILES = [
  { id: 'contextStream', label: 'Context Stream (AI Notes)', visible: true, order: 0, column: 'left', x: 0, y: 0, w: 7, h: 5 },
  { id: 'vectorDb', label: 'Vector DB (LanceDB)', visible: true, order: 1, column: 'left', x: 0, y: 5, w: 7, h: 4 },
  { id: 'prReviews', label: 'PR Reviews', visible: false, order: 2, column: 'left', x: 0, y: 9, w: 7, h: 4 },
  { id: 'performanceMetrics', label: 'Performance Metrics', visible: false, order: 3, column: 'left', x: 0, y: 13, w: 7, h: 4 },
  { id: 'reminders', label: 'Reminders', visible: true, order: 0, column: 'right', x: 7, y: 0, w: 5, h: 3 },
  { id: 'todos', label: 'To-Dos', visible: true, order: 1, column: 'right', x: 7, y: 3, w: 5, h: 4 },
  { id: 'taskTimeline', label: 'Task Timeline', visible: false, order: 2, column: 'right', x: 7, y: 7, w: 5, h: 4 }
];

const CONFIG_KEY = 'dashboard_tile_layout';

class TileConfigDbService {
  async init() {
    let tiles = await appStateDbService.getState(CONFIG_KEY);
    
    if (!tiles || tiles.length === 0) {
      tiles = DEFAULT_TILES;
      await appStateDbService.setState(CONFIG_KEY, tiles);
    } else {
      // Merge new default tiles if they don't exist in the current config
      let updated = false;
      DEFAULT_TILES.forEach(defaultTile => {
        const existing = tiles.find(t => t.id === defaultTile.id);
        if (!existing) {
          tiles.push(defaultTile);
          updated = true;
        } else {
          if (existing.column === undefined) {
            existing.column = defaultTile.column;
            updated = true;
          }
          if (existing.x === undefined) {
            existing.x = defaultTile.x;
            existing.y = defaultTile.y;
            existing.w = defaultTile.w;
            existing.h = defaultTile.h;
            updated = true;
          }
        }
      });
      if (updated) {
        await appStateDbService.setState(CONFIG_KEY, tiles);
      }
    }
  }

  async getConfig() {
    await this.init();
    return await appStateDbService.getState(CONFIG_KEY);
  }

  async updateConfig(tilesArray) {
    await this.init();
    
    // Ensure all tiles are valid IDs
    const validIds = DEFAULT_TILES.map(t => t.id);
    const validTiles = tilesArray.filter(t => validIds.includes(t.id));
    
    if (validTiles.length === 0) {
      throw new Error('Invalid tile configuration provided');
    }

    await appStateDbService.setState(CONFIG_KEY, validTiles);
    logger.info('Updated dashboard tile configuration in app state DB');
    return validTiles;
  }
}

export default new TileConfigDbService();
