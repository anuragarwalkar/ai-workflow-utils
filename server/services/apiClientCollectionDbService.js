/* eslint-disable max-lines */
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

class ApiClientCollectionDbService {
  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    this.collectionsDir = path.join(configDir, 'api-client-collections');
    this.indexPath = path.join(this.collectionsDir, 'index.json');
    
    this.initDirectories();
    logger.info(`API Client Collection database initialized at: ${this.collectionsDir}`);
  }

  async initDirectories() {
    try {
      if (!existsSync(this.collectionsDir)) {
        await fs.mkdir(this.collectionsDir, { recursive: true });
      }
      await this.initIndex();
    } catch (error) {
      logger.error('Failed to initialize directories:', error);
      throw error;
    }
  }

  async initIndex() {
    try {
      if (!existsSync(this.indexPath)) {
        const indexData = {
          collections: [],
          metadata: {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }
        };
        await fs.writeFile(this.indexPath, JSON.stringify(indexData, null, 2));
      }
    } catch (error) {
      logger.error('Failed to initialize index:', error);
      throw error;
    }
  }

  async getIndex() {
    const data = await fs.readFile(this.indexPath, 'utf8');
    return JSON.parse(data);
  }

  async updateIndex(indexData) {
    indexData.metadata.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.indexPath, JSON.stringify(indexData, null, 2));
  }

  async createCollection(collectionData) {
    try {
      const id = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Handle requests array
      const requests = Array.isArray(collectionData.requests) ? collectionData.requests : [];
      
      const apiClientCollection = {
        info: {
          _api_client_id: id,
          name: collectionData.name || 'New Collection',
          description: collectionData.description || '',
          schema: 'https://schema.api-client-utils.com/json/collection/v2.1.0/collection.json',
          _exporter_id: uuidv4()
        },
        item: requests.map(request => ApiClientCollectionDbService.convertToApiClientRequest(request)),
        auth: collectionData.auth || null,
        event: collectionData.event || [],
        variable: collectionData.variable || [],
        _api_client_exported_at: timestamp,
        _api_client_exported_using: 'AI Workflow Utils'
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
        requestCount: requests.length
      });

      await this.updateIndex(indexData);
      return apiClientCollection;
    } catch (error) {
      logger.error('Failed to create collection:', error);
      throw error;
    }
  }

  async getCollections() {
    const indexData = await this.getIndex();
    
    // Load full collection data for each collection
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
            _postman_exported_using: fullCollection._postman_exported_using
          };
        } catch (error) {
          logger.warn(`Failed to load collection data for ${collectionInfo.id}:`, error.message);
          return {
            ...collectionInfo,
            requests: []
          };
        }
      })
    );
    
    return collectionsWithData;
  }

  async getCollection(id) {
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
      variable: postmanCollection.variable
    };
  }

  async updateCollection(id, updates) {
    try {
      const { collectionInfo, postmanCollection } = await this.loadCollectionForUpdate(id);
      const updatedCollection = ApiClientCollectionDbService.applyCollectionUpdates(postmanCollection, updates);
      await this.saveCollectionUpdate(collectionInfo, updatedCollection);
      return updatedCollection;
    } catch (error) {
      logger.error('Failed to update collection:', error);
      throw error;
    }
  }

  async loadCollectionForUpdate(id) {
    const indexData = await this.getIndex();
    const collectionInfo = indexData.collections.find(collection => collection.id === id);
    
    if (!collectionInfo) {
      throw new Error(`Collection not found: ${id}`);
    }

    const data = await fs.readFile(collectionInfo.filePath, 'utf8');
    const postmanCollection = JSON.parse(data);
    
    return { collectionInfo, postmanCollection };
  }

  static applyCollectionUpdates(postmanCollection, updates) {
    if (updates.name) {
      postmanCollection.info.name = updates.name;
    }
    if (updates.description !== undefined) {
      postmanCollection.info.description = updates.description;
    }
    if (updates.requests) {
      postmanCollection.item = updates.requests.map(request => ApiClientCollectionDbService.convertToPostmanRequest(request));
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

  async saveCollectionUpdate(collectionInfo, postmanCollection) {
    await fs.writeFile(collectionInfo.filePath, JSON.stringify(postmanCollection, null, 2));

    const indexData = await this.getIndex();
    const collectionIndex = indexData.collections.findIndex(collection => collection.id === collectionInfo.id);
    
    indexData.collections[collectionIndex] = {
      ...indexData.collections[collectionIndex],
      name: postmanCollection.info.name,
      description: postmanCollection.info.description,
      updatedAt: postmanCollection._postman_exported_at,
      requestCount: (postmanCollection.item || []).length
    };

    await this.updateIndex(indexData);
  }

  async deleteCollection(id) {
    try {
      const indexData = await this.getIndex();
      const collectionInfo = indexData.collections.find(collection => collection.id === id);
      
      if (!collectionInfo) {
        throw new Error(`Collection not found: ${id}`);
      }

      // Delete the collection file
      await fs.unlink(collectionInfo.filePath);

      // Remove from index
      indexData.collections = indexData.collections.filter(collection => collection.id !== id);
      await this.updateIndex(indexData);

      return { success: true, message: 'Collection deleted successfully' };
    } catch (error) {
      logger.error('Failed to delete collection:', error);
      throw error;
    }
  }

  async importCollection(postmanCollection) {
    logger.info('Importing collection:', { 
      name: postmanCollection?.info?.name, 
      hasItems: Array.isArray(postmanCollection?.item) 
    });
    
    // Validate collection format
    if (!postmanCollection.info || !postmanCollection.info.name) {
      throw new Error('Invalid collection format: info.name is required');
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    // Normalize collection to Postman v2.1 format
    const normalizedCollection = {
      info: {
        _postman_id: id,
        name: postmanCollection.info.name,
        description: postmanCollection.info.description || '',
        schema: postmanCollection.info.schema || 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: postmanCollection.info._exporter_id || uuidv4()
      },
      item: this.normalizePostmanItems(postmanCollection.item || []),
      auth: postmanCollection.auth || null,
      event: postmanCollection.event || [],
      variable: postmanCollection.variable || [],
      _postman_exported_at: timestamp,
      _postman_exported_using: 'AI Workflow Utils'
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
      requestCount: this.countRequests(normalizedCollection.item)
    });

    await this.updateIndex(indexData);
    return normalizedCollection;
  }

  async exportCollection(id) {
    return await this.getCollection(id);
  }

  async exportAllCollections() {
    const indexData = await this.getIndex();
    const collections = [];

    for (const collectionInfo of indexData.collections) {
      const collection = await this.getCollection(collectionInfo.id);
      collections.push(collection);
    }

    return {
      collections,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'AI Workflow Utils',
        totalCount: collections.length
      }
    };
  }

  // Helper method to convert internal request format to Postman format
  static convertToPostmanRequest(request) {
    return {
      name: request.name || 'Untitled Request',
      request: {
        method: request.method || 'GET',
        header: ApiClientCollectionDbService.convertHeadersToPostman(request.headers || {}),
        url: ApiClientCollectionDbService.convertUrlToPostman(request.url, request.params || {}),
        body: ApiClientCollectionDbService.convertBodyToPostman(request.body, request.bodyType),
        auth: request.auth || null,
        description: request.description || ''
      },
      response: request.response || [],
      event: request.event || []
    };
  }

  // Helper method to convert Postman items to internal format
  convertFromPostmanItems(items) {
    return items.map(item => {
      if (item.item) {
        // It's a folder
        return {
          id: item.id || uuidv4(),
          name: item.name,
          type: 'folder',
          requests: this.convertFromPostmanItems(item.item)
        };
      } else {
        // It's a request
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
          event: item.event || []
        };
      }
    });
  }

  // Helper method to normalize Postman items (handle both v2.0 and v2.1)
  normalizePostmanItems(items) {
    return items.map(item => {
      if (item.item) {
        // It's a folder
        return {
          ...item,
          item: this.normalizePostmanItems(item.item)
        };
      } else {
        // It's a request - ensure it has proper structure
        return {
          name: item.name || 'Untitled Request',
          request: {
            method: item.request?.method || item.method || 'GET',
            header: Array.isArray(item.request?.header) ? item.request.header : [],
            url: item.request?.url || item.url || '',
            body: item.request?.body || item.body || null,
            auth: item.request?.auth || item.auth || null,
            description: item.request?.description || item.description || ''
          },
          response: item.response || [],
          event: item.event || []
        };
      }
    });
  }

  // Helper method to count total requests in collection
  countRequests(items) {
    let count = 0;
    for (const item of items) {
      if (item.item) {
        // It's a folder
        count += this.countRequests(item.item);
      } else {
        // It's a request
        count++;
      }
    }
    return count;
  }

  // Helper methods for URL conversion
  static convertUrlToPostman(url, params) {
    if (typeof url === 'string') {
      const urlObj = new URL(url);
      return {
        raw: url,
        protocol: urlObj.protocol.replace(':', ''),
        host: urlObj.hostname.split('.'),
        port: urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80'),
        path: urlObj.pathname.split('/').filter(Boolean),
        query: Object.entries(params).map(([key, value]) => ({ key, value }))
      };
    }
    return url;
  }

  static convertUrlFromPostman(postmanUrl) {
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

  static extractParamsFromPostmanUrl(postmanUrl) {
    if (postmanUrl && postmanUrl.query) {
      const params = {};
      postmanUrl.query.forEach(param => {
        if (param.key) {
          params[param.key] = param.value || '';
        }
      });
      return params;
    }
    return {};
  }

  // Helper methods for headers conversion
  static convertHeadersToPostman(headers) {
    return Object.entries(headers).map(([key, value]) => ({
      key,
      value,
      type: 'text'
    }));
  }

  static convertHeadersFromPostman(postmanHeaders) {
    const headers = {};
    postmanHeaders.forEach(header => {
      if (header.key && !header.disabled) {
        headers[header.key] = header.value || '';
      }
    });
    return headers;
  }

  // Helper methods for body conversion
  static convertBodyToPostman(body, bodyType) {
    if (!body) return null;

    switch (bodyType) {
      case 'json':
        return {
          mode: 'raw',
          raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
          options: {
            raw: {
              language: 'json'
            }
          }
        };
      case 'form-data':
        return {
          mode: 'formdata',
          formdata: Array.isArray(body) ? body : []
        };
      case 'x-www-form-urlencoded':
        return {
          mode: 'urlencoded',
          urlencoded: Array.isArray(body) ? body : []
        };
      default:
        return {
          mode: 'raw',
          raw: body
        };
    }
  }

  static convertBodyFromPostman(postmanBody) {
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

  static getBodyTypeFromPostman(postmanBody) {
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
