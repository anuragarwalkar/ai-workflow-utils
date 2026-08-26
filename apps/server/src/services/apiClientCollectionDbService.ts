/* eslint-disable max-lines */
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.ts';

export interface ApiClientRequestItem {
  id?: string;
  name?: string;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
  bodyType?: string;
  auth?: any;
  description?: string;
  response?: any[];
  event?: any[];
  [key: string]: any;
}

export interface CollectionIndexItem {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
  requestCount?: number;
  imported?: boolean;
}

export interface CollectionIndexData {
  collections: CollectionIndexItem[];
  metadata: {
    version: string;
    createdAt: string;
    lastUpdated: string;
  };
}

class ApiClientCollectionDbService {
  collectionsDir: string;
  indexPath: string;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    this.collectionsDir = path.join(configDir, 'api-client-collections');
    this.indexPath = path.join(this.collectionsDir, 'index.json');

    this.initDirectories();
    logger.info(`API Client Collection database initialized at: ${this.collectionsDir}`);
  }

  async initDirectories(): Promise<void> {
    try {
      if (!existsSync(this.collectionsDir)) {
        await fs.mkdir(this.collectionsDir, { recursive: true });
      }
      await this.initIndex();
    } catch (error: any) {
      logger.error('Failed to initialize directories:', error);
      throw error;
    }
  }

  async initIndex(): Promise<void> {
    try {
      if (!existsSync(this.indexPath)) {
        const indexData: CollectionIndexData = {
          collections: [],
          metadata: {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          },
        };
        await fs.writeFile(this.indexPath, JSON.stringify(indexData, null, 2));
      }
    } catch (error: any) {
      logger.error('Failed to initialize index:', error);
      throw error;
    }
  }

  async getIndex(): Promise<CollectionIndexData> {
    const data = await fs.readFile(this.indexPath, 'utf8');
    return JSON.parse(data);
  }

  async updateIndex(indexData: CollectionIndexData): Promise<void> {
    indexData.metadata.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.indexPath, JSON.stringify(indexData, null, 2));
  }

  async createCollection(collectionData: { name?: string; description?: string; requests?: any[]; auth?: any; event?: any[]; variable?: any[] }): Promise<any> {
    try {
      const id = uuidv4();
      const timestamp = new Date().toISOString();
      const requests = Array.isArray(collectionData.requests) ? collectionData.requests : [];

      const apiClientCollection = {
        info: {
          _api_client_id: id,
          name: collectionData.name || 'New Collection',
          description: collectionData.description || '',
          schema: 'https://schema.api-client-utils.com/json/collection/v2.1.0/collection.json',
          _exporter_id: uuidv4(),
        },
        item: requests.map(request => ApiClientCollectionDbService.convertToPostmanRequest(request)),
        auth: collectionData.auth || null,
        event: collectionData.event || [],
        variable: collectionData.variable || [],
        _api_client_exported_at: timestamp,
        _api_client_exported_using: 'AI Workflow Utils',
      };

      const collectionPath = path.join(this.collectionsDir, `${id}.json`);
      await fs.writeFile(collectionPath, JSON.stringify(apiClientCollection, null, 2));

      const indexData = await this.getIndex();
      indexData.collections.push({
        id,
        name: apiClientCollection.info.name,
        description: apiClientCollection.info.description,
        filePath: collectionPath,
        createdAt: timestamp,
        updatedAt: timestamp,
        requestCount: requests.length,
      });

      await this.updateIndex(indexData);
      return apiClientCollection;
    } catch (error: any) {
      logger.error('Failed to create collection:', error);
      throw error;
    }
  }

  async getCollections(): Promise<any[]> {
    const indexData = await this.getIndex();

    const collectionsWithData = await Promise.all(
      indexData.collections.map(async (collectionInfo) => {
        try {
          const collectionData = await fs.readFile(collectionInfo.filePath, 'utf8');
          const fullCollection = JSON.parse(collectionData);
          return {
            ...collectionInfo,
            info: fullCollection.info,
            requests: this.convertFromPostmanItems(fullCollection.item || []),
            auth: fullCollection.auth,
            event: fullCollection.event,
            variable: fullCollection.variable,
            _postman_exported_at: fullCollection._postman_exported_at,
            _postman_exported_using: fullCollection._postman_exported_using,
          };
        } catch (error: any) {
          logger.warn(`Failed to load collection data for ${collectionInfo.id}:`, error.message);
          return {
            ...collectionInfo,
            requests: [],
          };
        }
      })
    );

    return collectionsWithData;
  }

  async getCollection(id: string): Promise<any> {
    const indexData = await this.getIndex();
    const collectionInfo = indexData.collections.find(collection => collection.id === id);

    if (!collectionInfo) {
      throw new Error(`Collection not found: ${id}`);
    }

    const data = await fs.readFile(collectionInfo.filePath, 'utf8');
    const postmanCollection = JSON.parse(data);

    return {
      ...collectionInfo,
      info: postmanCollection.info,
      requests: this.convertFromPostmanItems(postmanCollection.item || []),
      auth: postmanCollection.auth,
      event: postmanCollection.event,
      variable: postmanCollection.variable,
    };
  }

  async updateCollection(id: string, updates: any): Promise<any> {
    try {
      const { collectionInfo, postmanCollection } = await this.loadCollectionForUpdate(id);
      const updatedCollection = ApiClientCollectionDbService.applyCollectionUpdates(postmanCollection, updates);
      await this.saveCollectionUpdate(collectionInfo, updatedCollection);
      return updatedCollection;
    } catch (error: any) {
      logger.error('Failed to update collection:', error);
      throw error;
    }
  }

  async loadCollectionForUpdate(id: string): Promise<{ collectionInfo: CollectionIndexItem; postmanCollection: any }> {
    const indexData = await this.getIndex();
    const collectionInfo = indexData.collections.find(collection => collection.id === id);

    if (!collectionInfo) {
      throw new Error(`Collection not found: ${id}`);
    }

    const data = await fs.readFile(collectionInfo.filePath, 'utf8');
    const postmanCollection = JSON.parse(data);

    return { collectionInfo, postmanCollection };
  }

  static applyCollectionUpdates(postmanCollection: any, updates: any): any {
    if (updates.name) {
      postmanCollection.info.name = updates.name;
    }
    if (updates.description !== undefined) {
      postmanCollection.info.description = updates.description;
    }
    if (updates.requests) {
      postmanCollection.item = updates.requests.map((request: any) =>
        ApiClientCollectionDbService.convertToPostmanRequest(request)
      );
    }
    if (updates.auth !== undefined) {
      postmanCollection.auth = updates.auth;
    }
    if (updates.variable) {
      postmanCollection.variable = updates.variable;
    }

    postmanCollection._postman_exported_at = new Date().toISOString();
    return postmanCollection;
  }

  async saveCollectionUpdate(collectionInfo: CollectionIndexItem, postmanCollection: any): Promise<void> {
    await fs.writeFile(collectionInfo.filePath, JSON.stringify(postmanCollection, null, 2));

    const indexData = await this.getIndex();
    const collectionIndex = indexData.collections.findIndex(collection => collection.id === collectionInfo.id);

    indexData.collections[collectionIndex] = {
      ...indexData.collections[collectionIndex],
      name: postmanCollection.info.name,
      description: postmanCollection.info.description,
      updatedAt: postmanCollection._postman_exported_at,
      requestCount: (postmanCollection.item || []).length,
    };

    await this.updateIndex(indexData);
  }

  async deleteCollection(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const indexData = await this.getIndex();
      const collectionInfo = indexData.collections.find(collection => collection.id === id);

      if (!collectionInfo) {
        throw new Error(`Collection not found: ${id}`);
      }

      await fs.unlink(collectionInfo.filePath);
      indexData.collections = indexData.collections.filter(collection => collection.id !== id);
      await this.updateIndex(indexData);

      return { success: true, message: 'Collection deleted successfully' };
    } catch (error: any) {
      logger.error('Failed to delete collection:', error);
      throw error;
    }
  }

  async importCollection(postmanCollection: any): Promise<any> {
    logger.info('Importing collection:', {
      name: postmanCollection?.info?.name,
      hasItems: Array.isArray(postmanCollection?.item),
    });

    if (!postmanCollection.info || !postmanCollection.info.name) {
      throw new Error('Invalid collection format: info.name is required');
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const normalizedCollection = {
      info: {
        _postman_id: id,
        name: postmanCollection.info.name,
        description: postmanCollection.info.description || '',
        schema: postmanCollection.info.schema || 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: postmanCollection.info._exporter_id || uuidv4(),
      },
      item: this.normalizePostmanItems(postmanCollection.item || []),
      auth: postmanCollection.auth || null,
      event: postmanCollection.event || [],
      variable: postmanCollection.variable || [],
      _postman_exported_at: timestamp,
      _postman_exported_using: 'AI Workflow Utils',
    };

    const collectionPath = path.join(this.collectionsDir, `${id}.json`);
    await fs.writeFile(collectionPath, JSON.stringify(normalizedCollection, null, 2));

    const indexData = await this.getIndex();
    indexData.collections.push({
      id,
      name: normalizedCollection.info.name,
      description: normalizedCollection.info.description,
      filePath: collectionPath,
      createdAt: timestamp,
      updatedAt: timestamp,
      imported: true,
      requestCount: this.countRequests(normalizedCollection.item),
    });

    await this.updateIndex(indexData);
    return normalizedCollection;
  }

  async exportCollection(id: string): Promise<any> {
    return await this.getCollection(id);
  }

  async exportAllCollections(): Promise<{ collections: any[]; metadata: Record<string, any> }> {
    const indexData = await this.getIndex();
    const collections: any[] = [];

    for (const collectionInfo of indexData.collections) {
      const collection = await this.getCollection(collectionInfo.id);
      collections.push(collection);
    }

    return {
      collections,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'AI Workflow Utils',
        totalCount: collections.length,
      },
    };
  }

  static convertToPostmanRequest(request: any): any {
    return {
      name: request.name || 'Untitled Request',
      request: {
        method: request.method || 'GET',
        header: ApiClientCollectionDbService.convertHeadersToPostman(request.headers || {}),
        url: ApiClientCollectionDbService.convertUrlToPostman(request.url, request.params || {}),
        body: ApiClientCollectionDbService.convertBodyToPostman(request.body, request.bodyType),
        auth: request.auth || null,
        description: request.description || '',
      },
      response: request.response || [],
      event: request.event || [],
    };
  }

  convertFromPostmanItems(items: any[]): any[] {
    return items.map(item => {
      if (item.item) {
        return {
          id: item.id || uuidv4(),
          name: item.name,
          type: 'folder',
          requests: this.convertFromPostmanItems(item.item),
        };
      } else {
        return {
          id: item.id || uuidv4(),
          name: item.name,
          method: item.request?.method || 'GET',
          url: ApiClientCollectionDbService.convertUrlFromPostman(item.request?.url),
          headers: ApiClientCollectionDbService.convertHeadersFromPostman(item.request?.header || []),
          params: ApiClientCollectionDbService.extractParamsFromPostmanUrl(item.request?.url),
          body: ApiClientCollectionDbService.convertBodyFromPostman(item.request?.body),
          bodyType: ApiClientCollectionDbService.getBodyTypeFromPostman(item.request?.body),
          auth: item.request?.auth,
          description: item.request?.description || '',
          response: item.response || [],
          event: item.event || [],
        };
      }
    });
  }

  normalizePostmanItems(items: any[]): any[] {
    return items.map(item => {
      if (item.item) {
        return {
          ...item,
          item: this.normalizePostmanItems(item.item),
        };
      } else {
        return {
          name: item.name || 'Untitled Request',
          request: {
            method: item.request?.method || item.method || 'GET',
            header: Array.isArray(item.request?.header) ? item.request.header : [],
            url: item.request?.url || item.url || '',
            body: item.request?.body || item.body || null,
            auth: item.request?.auth || item.auth || null,
            description: item.request?.description || item.description || '',
          },
          response: item.response || [],
          event: item.event || [],
        };
      }
    });
  }

  countRequests(items: any[]): number {
    let count = 0;
    for (const item of items) {
      if (item.item) {
        count += this.countRequests(item.item);
      } else {
        count++;
      }
    }
    return count;
  }

  static convertUrlToPostman(url: any, params: Record<string, any>): any {
    if (typeof url === 'string') {
      try {
        const urlObj = new URL(url);
        return {
          raw: url,
          protocol: urlObj.protocol.replace(':', ''),
          host: urlObj.hostname.split('.'),
          port: urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80'),
          path: urlObj.pathname.split('/').filter(Boolean),
          query: Object.entries(params).map(([key, value]) => ({ key, value })),
        };
      } catch {
        return url;
      }
    }
    return url;
  }

  static convertUrlFromPostman(postmanUrl: any): string {
    if (typeof postmanUrl === 'string') {
      return postmanUrl;
    }
    if (postmanUrl && postmanUrl.raw) {
      return postmanUrl.raw;
    }
    if (postmanUrl && postmanUrl.protocol && postmanUrl.host) {
      const protocol = `${postmanUrl.protocol}:`;
      const host = Array.isArray(postmanUrl.host) ? postmanUrl.host.join('.') : postmanUrl.host;
      const path = Array.isArray(postmanUrl.path) ? `/${postmanUrl.path.join('/')}` : '';
      return `${protocol}//${host}${path}`;
    }
    return '';
  }

  static extractParamsFromPostmanUrl(postmanUrl: any): Record<string, string> {
    if (postmanUrl && postmanUrl.query) {
      const params: Record<string, string> = {};
      postmanUrl.query.forEach((param: any) => {
        if (param.key) {
          params[param.key] = param.value || '';
        }
      });
      return params;
    }
    return {};
  }

  static convertHeadersToPostman(headers: Record<string, any>): any[] {
    return Object.entries(headers).map(([key, value]) => ({
      key,
      value: String(value),
      type: 'text',
    }));
  }

  static convertHeadersFromPostman(postmanHeaders: any[]): Record<string, string> {
    const headers: Record<string, string> = {};
    postmanHeaders.forEach((header: any) => {
      if (header.key && !header.disabled) {
        headers[header.key] = header.value || '';
      }
    });
    return headers;
  }

  static convertBodyToPostman(body: any, bodyType?: string): any {
    if (!body) return null;

    switch (bodyType) {
      case 'json':
        return {
          mode: 'raw',
          raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
          options: {
            raw: {
              language: 'json',
            },
          },
        };
      case 'form-data':
        return {
          mode: 'formdata',
          formdata: Array.isArray(body) ? body : [],
        };
      case 'x-www-form-urlencoded':
        return {
          mode: 'urlencoded',
          urlencoded: Array.isArray(body) ? body : [],
        };
      default:
        return {
          mode: 'raw',
          raw: body,
        };
    }
  }

  static convertBodyFromPostman(postmanBody: any): any {
    if (!postmanBody) return '';

    switch (postmanBody.mode) {
      case 'raw':
        return postmanBody.raw || '';
      case 'formdata':
        return postmanBody.formdata || [];
      case 'urlencoded':
        return postmanBody.urlencoded || [];
      default:
        return '';
    }
  }

  static getBodyTypeFromPostman(postmanBody: any): string {
    if (!postmanBody) return 'raw';

    switch (postmanBody.mode) {
      case 'raw':
        if (postmanBody.options?.raw?.language === 'json') {
          return 'json';
        }
        return 'raw';
      case 'formdata':
        return 'form-data';
      case 'urlencoded':
        return 'x-www-form-urlencoded';
      default:
        return 'raw';
    }
  }
}

export default new ApiClientCollectionDbService();
