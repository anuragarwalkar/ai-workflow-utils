import { LanceDB } from '@langchain/community/vectorstores/lancedb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { OllamaEmbeddings } from '@langchain/ollama';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { v4 as uuidv4 } from 'uuid';
import lanceDbService from './LanceDbService.ts';
import logger from '../../logger.ts';
import dotenv from 'dotenv';

dotenv.config();

class MemoryService {
  vectorStores: Map<string, any>;

  constructor() {
    this.vectorStores = new Map();
  }

  getEmbeddings(): any {
    if (process.env.OPENAI_COMPATIBLE_API_KEY && process.env.OPENAI_COMPATIBLE_BASE_URL) {
      return new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
        modelName: process.env.OPENAI_COMPATIBLE_EMBEDDING_MODEL || 'openai/text-embedding-3-small',
        configuration: {
          baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL,
        },
      });
    }

    if (process.env.OPENAI_API_KEY) {
      return new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
    }

    if (process.env.GOOGLE_API_KEY) {
      return new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GOOGLE_API_KEY });
    }

    if (process.env.OLLAMA_BASE_URL) {
      return new OllamaEmbeddings({
        baseUrl: process.env.OLLAMA_BASE_URL,
        model: process.env.OLLAMA_MODEL || 'nomic-embed-text',
      });
    }

    return new OpenAIEmbeddings();
  }

  async getVectorStore(tableName = 'summaries'): Promise<any> {
    if (!this.vectorStores.has(tableName)) {
      try {
        const embeddings = this.getEmbeddings();
        const table = await lanceDbService.getTable(tableName);
        const vectorStore = new LanceDB(embeddings, { table });
        this.vectorStores.set(tableName, vectorStore);
      } catch (err: any) {
        logger.error(`Error initializing VectorStore for ${tableName}`, err);
        throw err;
      }
    }
    return this.vectorStores.get(tableName);
  }

  async addMemory(text: string, metadata: Record<string, any> = {}, tableName = 'summaries'): Promise<string> {
    try {
      const vectorStore = await this.getVectorStore(tableName);
      const id = uuidv4();

      const normalizedMetadata = {
        id,
        type: metadata.type || 'general',
        sourceId: metadata.sourceId || '',
        summary: metadata.summary || '',
        tags: metadata.tags || [],
      };

      await vectorStore.addDocuments([{ pageContent: text, metadata: normalizedMetadata }]);
      logger.info(`Added memory to ${tableName}, id: ${id}`);
      return id;
    } catch (err: any) {
      logger.error('Failed to add memory:', err);
      throw err;
    }
  }

  async searchMemory(query: string, k = 5, tableName = 'summaries'): Promise<any[]> {
    try {
      const vectorStore = await this.getVectorStore(tableName);
      const results = await vectorStore.similaritySearch(query, k);
      return results;
    } catch (err: any) {
      logger.error('Failed to search memory:', err);
      return [];
    }
  }

  async searchMemoryWithScore(
    query: string,
    k = 5,
    tableName = 'summaries'
  ): Promise<{ results: any[]; durationMs: number }> {
    const t0 = Date.now();
    try {
      const vectorStore = await this.getVectorStore(tableName);
      let results: any[] = [];
      try {
        results = await vectorStore.similaritySearchWithScore(query, k);
      } catch (err: any) {
        logger.warn('similaritySearchWithScore fallback:', err.message);
        const docs = await vectorStore.similaritySearch(query, k);
        results = docs.map((d: any) => [d, d.metadata?._distance !== undefined ? d.metadata._distance : 0.5]);
      }
      const durationMs = Date.now() - t0;
      return { results, durationMs };
    } catch (err: any) {
      logger.error('Failed to search memory with score:', err);
      return { results: [], durationMs: Date.now() - t0 };
    }
  }

  async deleteMemoryBySourceId(sourceId: string, tableName = 'summaries'): Promise<void> {
    try {
      await this.getVectorStore(tableName);
      const table = await lanceDbService.getTable(tableName);
      await table.delete(`"sourceId" = '${sourceId}'`);
      logger.info(`Deleted memory from ${tableName} for sourceId: ${sourceId}`);
    } catch (err: any) {
      logger.error(`Failed to delete memory for sourceId ${sourceId}:`, err);
    }
  }
}

export default new MemoryService();
