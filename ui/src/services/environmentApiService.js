// Environment API service for handling API client environments
import { API_BASE_URL } from '../config/environment.js';

class EnvironmentApiService {
  static baseUrl = `${API_BASE_URL}/api/api-client`;

  static async getEnvironments() {
    const response = await fetch(`${this.baseUrl}/environments`);
    if (!response.ok) {
      throw new Error('Failed to fetch environments');
    }
    return response.json();
  }

  static async getActiveEnvironment() {
    const response = await fetch(`${this.baseUrl}/environments/active`);
    if (!response.ok) {
      throw new Error('Failed to fetch active environment');
    }
    return response.json();
  }

  static async createEnvironment(environmentData) {
    const response = await fetch(`${this.baseUrl}/environments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(environmentData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create environment');
    }
    return response.json();
  }

  static async updateEnvironment(id, environmentData) {
    const response = await fetch(`${this.baseUrl}/environments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(environmentData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update environment');
    }
    return response.json();
  }

  static async deleteEnvironment(id) {
    const response = await fetch(`${this.baseUrl}/environments/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete environment');
    }
    return response.json();
  }

  static async setActiveEnvironment(id) {
    const response = await fetch(`${this.baseUrl}/environments/${id}/activate`, {
      method: 'PUT',
    });
    
    if (!response.ok) {
      throw new Error('Failed to set active environment');
    }
    return response.json();
  }

  static async exportEnvironment(id) {
    const response = await fetch(`${this.baseUrl}/environments/${id}/export`);
    if (!response.ok) {
      throw new Error('Failed to export environment');
    }
    return response.json();
  }

  static async exportAllEnvironments() {
    const response = await fetch(`${this.baseUrl}/environments/export/all`);
    if (!response.ok) {
      throw new Error('Failed to export all environments');
    }
    return response.json();
  }

  static async importEnvironment(environmentData) {
    const response = await fetch(`${this.baseUrl}/environments/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(environmentData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to import environment');
    }
    return response.json();
  }

  // Utility function to substitute environment variables in a string
  static substituteVariables(text, variables = {}) {
    if (!text || typeof text !== 'string') return text;
    
    // Replace {{variable_name}} patterns with actual values
    return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedVarName = varName.trim();
      return variables[trimmedVarName] || match;
    });
  }

  // Get autocomplete suggestions for variable names
  static getVariableSuggestions(environments = []) {
    const suggestions = new Set();
    
    // Ensure environments is an array
    const envArray = Array.isArray(environments) ? environments : [];
    
    envArray.forEach(env => {
      Object.keys(env.variables || {}).forEach(key => {
        suggestions.add(key);
      });
    });
    
    return Array.from(suggestions).sort();
  }

  // Validate environment data
  static validateEnvironment(environmentData) {
    const errors = [];
    
    if (!environmentData.name || environmentData.name.trim() === '') {
      errors.push('Environment name is required');
    }
    
    if (environmentData.variables && typeof environmentData.variables !== 'object') {
      errors.push('Variables must be an object');
    }
    
    // Check for valid variable names (no spaces, special chars except underscore and hyphen)
    if (environmentData.variables) {
      Object.keys(environmentData.variables).forEach(key => {
        if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(key)) {
          errors.push(`Invalid variable name: ${key}. Use only letters, numbers, underscores, and hyphens.`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Convert to Postman v2.1 format
  static toPostmanFormat(environment) {
    return {
      id: environment.id,
      name: environment.name,
      values: Object.entries(environment.variables || {}).map(([key, value]) => ({
        key,
        value: String(value),
        enabled: true,
        type: 'text',
      })),
      _postman_variable_scope: 'environment',
      _postman_exported_at: new Date().toISOString(),
      _postman_exported_using: 'AI Workflow Utils',
    };
  }

  // Convert from Postman v2.1 format
  static fromPostmanFormat(postmanData) {
    const variables = {};
    
    if (postmanData.values && Array.isArray(postmanData.values)) {
      postmanData.values.forEach(item => {
        if (item.enabled !== false) {
          variables[item.key] = item.value;
        }
      });
    }
    
    return {
      id: postmanData.id || `env_${Date.now()}`,
      name: postmanData.name || 'Imported Environment',
      variables,
    };
  }
}

export default EnvironmentApiService;
