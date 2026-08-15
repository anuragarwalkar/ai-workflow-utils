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

  async getTable(tableName) {
    // OpenAI text-embedding-3-small and text-embedding-ada-002 use 1536.
    // If you swap embeddings later, you MUST delete the old LanceDB folder and recreate it.
    const vectorSize = 1536; 
    
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

  async getStats() {
    await this.init();
    try {
      const tableNames = await this.db.tableNames();
      const tables = [];
      let totalRecords = 0;

      for (const name of tableNames) {
        try {
          const tbl = await this.db.openTable(name);
          const rowCount = await tbl.countRows();
          totalRecords += rowCount;
          
          let schemaFields = [];
          let vectorDim = 1536;
          try {
            const schema = await tbl.schema();
            schemaFields = (schema.fields || []).map(f => {
              const typeStr = f.type ? f.type.toString() : 'Unknown';
              if (f.name === 'vector' && typeStr.includes('[')) {
                const match = typeStr.match(/\[(\d+)\]/);
                if (match) vectorDim = parseInt(match[1], 10);
              }
              return {
                name: f.name,
                type: typeStr,
                nullable: f.nullable !== false
              };
            });
          } catch (e) {
            logger.warn(`Could not read schema for table ${name}:`, e.message);
          }

          tables.push({
            name,
            rowCount,
            vectorDim,
            fieldsCount: schemaFields.length,
            fields: schemaFields,
          });
        } catch (tblErr) {
          logger.warn(`Error reading table ${name}:`, tblErr.message);
          tables.push({ name, rowCount: 0, vectorDim: 1536, fieldsCount: 0, fields: [] });
        }
      }

      // Calculate disk size
      const diskSizeBytes = this.getDirectorySize(this.dbPath);
      const diskSizeFormatted = this.formatBytes(diskSizeBytes);

      // Detect embedding configuration from environment
      const embeddingInfo = this.detectEmbeddingConfig();

      // Get sample distribution from summaries table
      let typeDistribution = { note: 0, summary: 0, general: 0, other: 0 };
      let recentRecords = [];
      if (tableNames.includes('summaries')) {
        try {
          const summariesTbl = await this.db.openTable('summaries');
          const sampleRows = await summariesTbl.query().limit(50).toArray();
          sampleRows.forEach(r => {
            const type = (r.type || 'general').toLowerCase();
            if (typeDistribution[type] !== undefined) {
              typeDistribution[type]++;
            } else {
              typeDistribution.other++;
            }
          });

          // Recent 5 items
          recentRecords = sampleRows.slice(0, 5).map(r => this.formatRow(r));
        } catch (e) {
          logger.warn('Could not compute type distribution:', e.message);
        }
      }

      return {
        connected: true,
        dbPath: this.dbPath,
        engine: 'LanceDB Embedded Columnar Vector DB',
        version: '0.19.1',
        tableCount: tableNames.length,
        totalRecords,
        tables,
        diskSizeBytes,
        diskSizeFormatted,
        embeddingInfo,
        typeDistribution,
        recentRecords,
        distanceMetric: 'Cosine Similarity / L2 Distance',
        status: 'healthy',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get LanceDB stats:', error);
      throw error;
    }
  }

  getDirectorySize(dirPath) {
    let total = 0;
    try {
      if (!fs.existsSync(dirPath)) return 0;
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          total += this.getDirectorySize(fullPath);
        } else {
          try {
            total += fs.statSync(fullPath).size;
          } catch {
            // Ignore if file was moved/deleted
          }
        }
      }
    } catch (e) {
      logger.warn('Error computing directory size:', e.message);
    }
    return total;
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  detectEmbeddingConfig() {
    if (process.env.OPENAI_COMPATIBLE_API_KEY && process.env.OPENAI_COMPATIBLE_BASE_URL) {
      return {
        provider: 'OpenAI-Compatible',
        model: process.env.OPENAI_COMPATIBLE_EMBEDDING_MODEL || 'openai/text-embedding-3-small',
        dimension: 1536,
        baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL
      };
    }
    if (process.env.OPENAI_API_KEY) {
      return {
        provider: 'OpenAI Native',
        model: 'text-embedding-3-small',
        dimension: 1536,
        baseUrl: 'https://api.openai.com/v1'
      };
    }
    if (process.env.GOOGLE_API_KEY) {
      return {
        provider: 'Google Gemini',
        model: 'text-embedding-004',
        dimension: 768,
        baseUrl: 'Google Generative AI'
      };
    }
    if (process.env.OLLAMA_BASE_URL) {
      return {
        provider: 'Ollama Local',
        model: process.env.OLLAMA_MODEL || 'nomic-embed-text',
        dimension: 768,
        baseUrl: process.env.OLLAMA_BASE_URL
      };
    }
    return {
      provider: 'Default Embedding Provider',
      model: 'text-embedding-3-small',
      dimension: 1536,
      baseUrl: 'Standard Provider'
    };
  }

  formatRow(row) {
    const rawTags = row.tags;
    let tags = [];
    if (Array.isArray(rawTags)) {
      tags = rawTags;
    } else if (rawTags && typeof rawTags.toArray === 'function') {
      tags = rawTags.toArray();
    } else if (rawTags && typeof rawTags === 'object') {
      try {
        tags = Array.from(rawTags);
      } catch {
        tags = [];
      }
    }

    const vectorData = row.vector;
    let vectorDim = 0;
    let vectorSample = [];
    let vectorNorm = 0;

    if (vectorData) {
      vectorDim = vectorData.length || 0;
      try {
        const arr = Array.from(vectorData);
        vectorSample = arr.slice(0, 6).map(n => Number(Number(n).toFixed(4)));
        const sumSq = arr.reduce((acc, v) => acc + (v * v), 0);
        vectorNorm = Number(Math.sqrt(sumSq).toFixed(4));
      } catch {
        vectorSample = [];
      }
    }

    return {
      id: row.id || '',
      type: row.type || 'general',
      sourceId: row.sourceId || '',
      summary: row.summary || '',
      tags,
      text: row.text || '',
      vectorSnippet: {
        dimensions: vectorDim,
        sample: vectorSample,
        norm: vectorNorm,
        hasVector: vectorDim > 0
      }
    };
  }

  async getTableRecords(tableName = 'summaries', { limit = 50, offset = 0, type = null, search = null } = {}) {
    await this.init();
    try {
      const table = await this.getTable(tableName);
      const totalCount = await table.countRows();

      // Query records
      let allRows = await table.query().toArray();

      // Apply type filter if provided
      if (type && type !== 'all') {
        allRows = allRows.filter(r => (r.type || '').toLowerCase() === type.toLowerCase());
      }

      // Apply in-memory text search if provided
      if (search && search.trim()) {
        const query = search.toLowerCase();
        allRows = allRows.filter(r => 
          (r.text && r.text.toLowerCase().includes(query)) ||
          (r.summary && r.summary.toLowerCase().includes(query)) ||
          (r.id && r.id.toLowerCase().includes(query)) ||
          (r.sourceId && r.sourceId.toLowerCase().includes(query))
        );
      }

      const filteredCount = allRows.length;
      const paginatedRows = allRows.slice(offset, offset + limit);
      const records = paginatedRows.map(r => this.formatRow(r));

      return {
        tableName,
        totalCount,
        filteredCount,
        limit,
        offset,
        records
      };
    } catch (error) {
      logger.error(`Failed to get records for table ${tableName}:`, error);
      throw error;
    }
  }

  async getTableSchema(tableName = 'summaries') {
    await this.init();
    try {
      const table = await this.getTable(tableName);
      const count = await table.countRows();
      const schema = await table.schema();
      
      const fields = (schema.fields || []).map(f => ({
        name: f.name,
        type: f.type ? f.type.toString() : 'Unknown',
        nullable: f.nullable !== false
      }));

      return {
        tableName,
        rowCount: count,
        fields,
        primaryKey: 'id',
        vectorColumn: 'vector'
      };
    } catch (error) {
      logger.error(`Failed to get schema for table ${tableName}:`, error);
      throw error;
    }
  }

  async deleteRecord(tableName = 'summaries', id) {
    await this.init();
    try {
      const table = await this.getTable(tableName);
      await table.delete(`id = '${id}'`);
      logger.info(`Deleted record ${id} from table ${tableName}`);
      return { success: true, id };
    } catch (error) {
      logger.error(`Failed to delete record ${id} from ${tableName}:`, error);
      throw error;
    }
  }

  async deleteRecords(tableName = 'summaries', ids = [], { deleteAll = false, type = null } = {}) {
    await this.init();
    try {
      const table = await this.getTable(tableName);
      if (deleteAll) {
        if (type && type !== 'all') {
          await table.delete(`type = '${type}'`);
          logger.info(`Deleted all records of type '${type}' from table ${tableName}`);
        } else {
          await table.delete("id IS NOT NULL OR id IS NULL");
          logger.info(`Deleted all records from table ${tableName}`);
        }
        return { success: true, count: 'all' };
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        return { success: true, count: 0, ids: [] };
      }

      const escapedIds = ids.map(id => `'${String(id).replace(/'/g, "\\'")}'`).join(', ');
      await table.delete(`id in (${escapedIds})`);
      logger.info(`Deleted ${ids.length} records from table ${tableName}`);
      return { success: true, count: ids.length, ids };
    } catch (error) {
      logger.error(`Failed to delete batch records from ${tableName}:`, error);
      throw error;
    }
  }

  async runDiagnostics() {
    await this.init();
    const checks = [];
    const t0 = Date.now();

    // 1. Connection check
    checks.push({
      name: 'LanceDB Engine Connection',
      status: this.db ? 'PASS' : 'FAIL',
      details: `Connected at ${this.dbPath}`
    });

    // 2. Table Accessibility
    let summariesCount = 0;
    try {
      const table = await this.getSummariesTable();
      summariesCount = await table.countRows();
      checks.push({
        name: 'Table Integrity (summaries)',
        status: 'PASS',
        details: `Accessible with ${summariesCount} rows`
      });
    } catch (e) {
      checks.push({
        name: 'Table Integrity (summaries)',
        status: 'FAIL',
        details: e.message
      });
    }

    // 3. Schema & Vector Dimension Check
    try {
      const table = await this.getSummariesTable();
      const schema = await table.schema();
      const vectorField = schema.fields.find(f => f.name === 'vector');
      checks.push({
        name: 'Vector Schema & Dimension',
        status: vectorField ? 'PASS' : 'WARN',
        details: vectorField ? `Vector field: ${vectorField.type.toString()}` : 'Vector column not found'
      });
    } catch (e) {
      checks.push({
        name: 'Vector Schema & Dimension',
        status: 'FAIL',
        details: e.message
      });
    }

    // 4. Embedding Configuration
    const embedding = this.detectEmbeddingConfig();
    checks.push({
      name: 'Embeddings Provider Configuration',
      status: 'PASS',
      details: `${embedding.provider} (${embedding.model}, ${embedding.dimension} dimensions)`
    });

    return {
      allPassed: checks.every(c => c.status === 'PASS'),
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - t0,
      checks
    };
  }
}

export default new LanceDbService();
