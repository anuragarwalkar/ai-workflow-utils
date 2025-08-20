// Collections API service for handling API client collections
import { API_BASE_URL } from '../config/environment.js';

class CollectionsApiService {
  static baseUrl = `${API_BASE_URL}/api/api-client`;

  static async getCollections() {
    const response = await fetch(`${this.baseUrl}/collections`);
    if (!response.ok) {
      throw new Error('Failed to fetch collections');
    }
    return response.json();
  }

  static async getCollection(id) {
    const response = await fetch(`${this.baseUrl}/collections/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch collection');
    }
    return response.json();
  }

  static async createCollection(collectionData) {
    const response = await fetch(`${this.baseUrl}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collectionData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create collection');
    }
    return response.json();
  }

  static async updateCollection(id, collectionData) {
    const response = await fetch(`${this.baseUrl}/collections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collectionData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update collection');
    }
    return response.json();
  }

  static async deleteCollection(id) {
    const response = await fetch(`${this.baseUrl}/collections/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete collection');
    }
    return response.json();
  }

  static async importCollection(collectionData) {
    const response = await fetch(`${this.baseUrl}/collections/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collectionData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to import collection');
    }
    return response.json();
  }

  static async exportCollection(id) {
    const response = await fetch(`${this.baseUrl}/collections/${id}/export`);
    if (!response.ok) {
      throw new Error('Failed to export collection');
    }
    return response.json();
  }

  static async exportAllCollections() {
    const response = await fetch(`${this.baseUrl}/collections/export/all`);
    if (!response.ok) {
      throw new Error('Failed to export all collections');
    }
    return response.json();
  }
}

export default CollectionsApiService;
