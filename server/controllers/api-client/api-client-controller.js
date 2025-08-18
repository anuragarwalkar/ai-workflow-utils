/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable no-unused-vars */
// TODO: refactor this component and create a service
import axios from 'axios';
import https from 'https';
import logger from '../../logger.js';

// Create axios instance with SSL configuration to avoid certificate errors
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Ignore self-signed certificate errors
  }),
});

/**
 * Execute HTTP request through the API client
 */
export const executeRequest = async (req, res) => {
  try {
    const { method, url, headers = {}, params = {}, body, bodyType, auth } = req.body;

    if (!url) {
      return res.status(400).json({
        error: true,
        message: 'URL is required'
      });
    }

    if (!method) {
      return res.status(400).json({
        error: true,
        message: 'HTTP method is required'
      });
    }

    logger.info(`🌐 API Client: Executing ${method.toUpperCase()} request to ${url}`);

    // Prepare headers with authentication
    const requestHeaders = { ...headers };

    // Handle authentication
    if (auth && auth.type) {
      switch (auth.type) {
        case 'bearer':
          if (auth.token) {
            requestHeaders['Authorization'] = `Bearer ${auth.token}`;
          }
          break;
        case 'basic':
          if (auth.username && auth.password) {
            const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
            requestHeaders['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'apikey':
          if (auth.apiKey && auth.apiKeyHeader) {
            requestHeaders[auth.apiKeyHeader] = auth.apiKey;
          }
          break;
        default:
          logger.warn(`Unknown auth type: ${auth.type}`);
      }
    }

    // Prepare axios config
    const axiosConfig = {
      method: method.toLowerCase(),
      url,
      headers: requestHeaders,
      params,
      timeout: 30000, // 30 seconds timeout
      validateStatus: () => true, // Don't throw for any status code
    };

    // Add body for methods that support it
    if (['post', 'put', 'patch'].includes(method.toLowerCase()) && body) {
      if (bodyType === 'json') {
        try {
          axiosConfig.data = typeof body === 'string' ? JSON.parse(body) : body;
          axiosConfig.headers['Content-Type'] = 'application/json';
        } catch (error) {
          return res.status(400).json({
            error: true,
            message: 'Invalid JSON in request body'
          });
        }
      } else if (bodyType === 'form-data') {
        // TODO: Handle form-data
        axiosConfig.data = body;
        axiosConfig.headers['Content-Type'] = 'multipart/form-data';
      } else if (bodyType === 'x-www-form-urlencoded') {
        axiosConfig.data = body;
        axiosConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        // Raw text
        axiosConfig.data = body;
        axiosConfig.headers['Content-Type'] = 'text/plain';
      }
    }

    const startTime = Date.now();
    console.log('axiosConfig:', JSON.stringify(axiosConfig, null, 2))
    // Execute the request using the configured axios instance
    const response = await axiosInstance(axiosConfig);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Calculate response size
    const responseSize = JSON.stringify(response.data).length;

    // Log the response
    logger.info(`✅ API Client: Request completed - Status: ${response.status}, Time: ${responseTime}ms, Size: ${responseSize}B`);

    // Return structured response
    const apiResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime,
      size: responseSize,
      contentType: response.headers['content-type'] || 'unknown',
      error: false,
    };

    res.json(apiResponse);

  } catch (error) {
    logger.error('❌ API Client request failed:', error.message);

    // Handle axios-specific errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return res.json({
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        responseTime: 0,
        size: 0,
        contentType: error.response.headers['content-type'] || 'unknown',
        error: true,
        message: `HTTP ${error.response.status}: ${error.response.statusText}`,
      });
    } else if (error.request) {
      // The request was made but no response was received
      return res.json({
        error: true,
        message: 'No response received from server (network error)',
        status: 0,
        responseTime: 0,
        size: 0,
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).json({
        error: true,
        message: error.message || 'Request configuration error',
        status: 0,
        responseTime: 0,
        size: 0,
      });
    }
  }
};

/**
 * Get collections (placeholder for now)
 */
export const getCollections = async (req, res) => {
  try {
    // TODO: Implement collections storage (database or file system)
    logger.info('📁 API Client: Getting collections');
    
    res.json({
      collections: [
        {
          id: 1,
          name: 'Sample Collection',
          requests: [
            {
              id: 1,
              name: 'Get Users',
              method: 'GET',
              url: 'https://jsonplaceholder.typicode.com/users',
              headers: {},
              params: {},
              body: '',
              bodyType: 'json'
            },
            {
              id: 2,
              name: 'Create User',
              method: 'POST',
              url: 'https://jsonplaceholder.typicode.com/users',
              headers: { 'Content-Type': 'application/json' },
              params: {},
              body: '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
              bodyType: 'json'
            }
          ]
        }
      ]
    });
  } catch (error) {
    logger.error('❌ API Client: Failed to get collections:', error.message);
    res.status(500).json({ error: 'Failed to retrieve collections' });
  }
};

/**
 * Save collection (placeholder for now)
 */
export const saveCollection = async (req, res) => {
  try {
    const { name, requests } = req.body;
    
    logger.info(`💾 API Client: Saving collection "${name}" with ${requests?.length || 0} requests`);
    
    // TODO: Implement collections storage
    const savedCollection = {
      id: Date.now(),
      name,
      requests,
      createdAt: new Date().toISOString(),
    };
    
    res.json({ success: true, collection: savedCollection });
  } catch (error) {
    logger.error('❌ API Client: Failed to save collection:', error.message);
    res.status(500).json({ error: 'Failed to save collection' });
  }
};

/**
 * Get environments (placeholder for now)
 */
export const getEnvironments = async (req, res) => {
  try {
    logger.info('🌍 API Client: Getting environments');
    
    // TODO: Implement environments storage
    res.json({
      environments: [
        {
          id: 1,
          name: 'Development',
          variables: {
            API_URL: 'https://api-dev.example.com',
            API_KEY: 'dev-api-key-123'
          }
        },
        {
          id: 2,
          name: 'Production',
          variables: {
            API_URL: 'https://api.example.com',
            API_KEY: 'prod-api-key-456'
          }
        }
      ]
    });
  } catch (error) {
    logger.error('❌ API Client: Failed to get environments:', error.message);
    res.status(500).json({ error: 'Failed to retrieve environments' });
  }
};

/**
 * Save environment (placeholder for now)
 */
export const saveEnvironment = async (req, res) => {
  try {
    const { name, variables } = req.body;
    
    logger.info(`🌍 API Client: Saving environment "${name}"`);
    
    // TODO: Implement environments storage
    const savedEnvironment = {
      id: Date.now(),
      name,
      variables,
      createdAt: new Date().toISOString(),
    };
    
    res.json({ success: true, environment: savedEnvironment });
  } catch (error) {
    logger.error('❌ API Client: Failed to save environment:', error.message);
    res.status(500).json({ error: 'Failed to save environment' });
  }
};

/**
 * Export collections in Postman v2 format
 */
export const exportCollections = async (req, res) => {
  try {
    logger.info('📤 API Client: Exporting collections to Postman format');
    
    // TODO: Implement actual collection export
    const postmanCollection = {
      info: {
        name: 'AI Workflow Utils Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'Sample Request',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: 'https://jsonplaceholder.typicode.com/users',
              protocol: 'https',
              host: ['jsonplaceholder', 'typicode', 'com'],
              path: ['users']
            }
          }
        }
      ]
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ai-workflow-utils-collection.json');
    res.json(postmanCollection);
  } catch (error) {
    logger.error('❌ API Client: Failed to export collections:', error.message);
    res.status(500).json({ error: 'Failed to export collections' });
  }
};

/**
 * Import Postman collection
 */
export const importCollection = async (req, res) => {
  try {
    const { collection } = req.body;
    
    logger.info('📥 API Client: Importing Postman collection');
    
    // TODO: Validate and parse Postman collection format
    // TODO: Convert to internal format and save
    
    res.json({ 
      success: true, 
      message: 'Collection imported successfully',
      importedRequests: collection?.item?.length || 0
    });
  } catch (error) {
    logger.error('❌ API Client: Failed to import collection:', error.message);
    res.status(500).json({ error: 'Failed to import collection' });
  }
};
