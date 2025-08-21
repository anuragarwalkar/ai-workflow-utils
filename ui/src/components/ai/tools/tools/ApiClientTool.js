/**
 * API Client Tool - Makes HTTP requests to external APIs
 */

import { BaseTool } from '../BaseTool';
import { createLogger } from '../../../../utils/log';

const logger = createLogger('ApiClientTool');

export class ApiClientTool extends BaseTool {
  constructor() {
    super({
      name: 'api_client',
      description: 'Makes HTTP requests to external APIs and returns responses',
      category: 'network',
      parameters: {
        url: {
          type: 'string',
          description: 'The API endpoint URL',
          required: true,
        },
        method: {
          type: 'string',
          description: 'HTTP method',
          required: false,
          default: 'GET',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        },
        headers: {
          type: 'object',
          description: 'HTTP headers as key-value pairs',
          required: false,
          additionalProperties: {
            type: 'string',
          },
        },
        body: {
          type: 'object',
          description: 'Request body (for POST, PUT, PATCH methods)',
          required: false,
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds',
          required: false,
          default: 5000,
          minimum: 1000,
          maximum: 30000,
        },
      },
    });
  }

  async execute(params) {
    logger.info('execute', 'Making API request', { 
      url: params.url,
      method: params.method,
      timeout: params.timeout,
    });

    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock API response
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-response-time': '45ms',
        'x-rate-limit-remaining': '999',
      },
      data: {
        success: true,
        message: 'Mock API response',
        timestamp: new Date().toISOString(),
        method: params.method || 'GET',
        url: params.url,
        requestId: Math.random().toString(36).substring(7),
        data: params.method === 'GET' ? {
          users: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
          ],
          total: 2,
          page: 1,
        } : {
          created: true,
          id: Math.floor(Math.random() * 1000) + 1,
          ...params.body,
        },
      },
    };

    // Simulate occasional errors
    if (Math.random() < 0.1) { // 10% chance of error
      return {
        success: false,
        error: 'Network timeout',
        status: 408,
        timestamp: new Date().toISOString(),
        url: params.url,
        method: params.method,
      };
    }

    return {
      success: true,
      response: mockResponse,
      requestTime: Math.floor(Math.random() * 200) + 50, // milliseconds
      summary: `${params.method || 'GET'} request to ${params.url} completed successfully`,
      timestamp: new Date().toISOString(),
    };
  }
}

// Auto-instantiate to register the tool
new ApiClientTool();

export default ApiClientTool;
