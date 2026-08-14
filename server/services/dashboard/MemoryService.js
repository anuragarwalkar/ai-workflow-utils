import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/ollama";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { v4 as uuidv4 } from "uuid";
import lanceDbService from "./LanceDbService.js";
import logger from "../../logger.js";
import dotenv from "dotenv";

dotenv.config();

class MemoryService {
  constructor() {
    this.vectorStores = new Map();
  }

  getEmbeddings() {
    // Try to get the best available embedding model
    if (process.env.OPENAI_COMPATIBLE_API_KEY && process.env.OPENAI_COMPATIBLE_BASE_URL) {
      return new OpenAIEmbeddings({ 
        openAIApiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
        modelName: process.env.OPENAI_COMPATIBLE_EMBEDDING_MODEL || "openai/text-embedding-3-small",
        configuration: {
          baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL,
        }
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
        model: process.env.OLLAMA_MODEL || "nomic-embed-text" 
      });
    }

    // Fallback to OpenAI if no specific config is found but might be loaded later
    return new OpenAIEmbeddings();
  }

  async getVectorStore(tableName = 'summaries') {
    if (!this.vectorStores.has(tableName)) {
      try {
        const embeddings = this.getEmbeddings();
        
        // Wait, for LanceDB we don't need to specify vectorSize manually if we let LangChain handle it.
        // Actually, LanceDB table initialization requires schema if empty.
        // Let's create a dummy document and delete it, to set schema based on the actual embedding dimensions
        let table = await lanceDbService.getTable(tableName);
        
        // if table is totally empty and schema is dummy (dim=1536), it might clash with ollama.
        // It's safer to just instantiate LanceDB from langchain.
        const vectorStore = new LanceDB(embeddings, { table });
        
        this.vectorStores.set(tableName, vectorStore);
      } catch (err) {
        logger.error(`Error initializing VectorStore for ${tableName}`, err);
        throw err;
      }
    }
    return this.vectorStores.get(tableName);
  }

  async addMemory(text, metadata = {}, tableName = 'summaries') {
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
    } catch (err) {
      logger.error('Failed to add memory:', err);
      throw err;
    }
  }

  async searchMemory(query, k = 5, tableName = 'summaries') {
    try {
      const vectorStore = await this.getVectorStore(tableName);
      const results = await vectorStore.similaritySearch(query, k);
      return results;
    } catch (err) {
      logger.error('Failed to search memory:', err);
      return [];
    }
  }

  async deleteMemoryBySourceId(sourceId, tableName = 'summaries') {
    try {
      await this.getVectorStore(tableName);
      const table = await lanceDbService.getTable(tableName);
      // Double quote "sourceId" for LanceDB / DataFusion case-sensitive column matching
      await table.delete(`"sourceId" = '${sourceId}'`);
      logger.info(`Deleted memory from ${tableName} for sourceId: ${sourceId}`);
    } catch (err) {
      logger.error(`Failed to delete memory for sourceId ${sourceId}:`, err);
    }
  }
}

export default new MemoryService();
