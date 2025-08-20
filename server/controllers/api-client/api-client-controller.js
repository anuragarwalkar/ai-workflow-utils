/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable no-unused-vars */
// TODO: refactor this component and create a service
import axios from 'axios';
import https from 'https';
import logger from '../../logger.js';
import langchainApiClientService from '../../services/langchain/LangChainApiClientService.js';

// Create axios instance with SSL configuration to avoid certificate errors
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Ignore self-signed certificate errors
  }),
});

/**
 * Convert natural language to API request configuration
 */
export const convertNaturalLanguageToApi = async (req, res) => {
  try {
    const { prompt, streaming = false } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Natural language prompt is required'
      });
    }

    logger.info(`🤖 API Client: Converting natural language prompt: "${prompt.substring(0, 100)}..."`);

    // Initialize the service if not already done
    await langchainApiClientService.initialize();

    if (streaming) {
      // Set up Server-Sent Events for streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      let streamingComplete = false;
      let finalApiRequest = null;

      const streamCallback = (data) => {
        if (!streamingComplete) {
          try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
            
            if (data.type === 'complete') {
              streamingComplete = true;
              // Parse the final response
              langchainApiClientService.parseAndEnhanceResponse(data.fullContent)
                .then(apiRequest => {
                  finalApiRequest = apiRequest;
                  res.write(`data: ${JSON.stringify({
                    type: 'final',
                    apiRequest,
                    provider: data.provider
                  })}\n\n`);
                  res.write('data: [DONE]\n\n');
                  res.end();
                })
                .catch(error => {
                  res.write(`data: ${JSON.stringify({
                    type: 'error',
                    error: error.message
                  })}\n\n`);
                  res.end();
                });
            }
          } catch (writeError) {
            logger.error('Error writing streaming response:', writeError);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Streaming error' });
            }
          }
        }
      };

      // Handle client disconnect
      req.on('close', () => {
        streamingComplete = true;
        logger.info('Client disconnected from natural language streaming');
      });

      try {
        await langchainApiClientService.convertNaturalLanguageToApiRequest(prompt, streamCallback);
      } catch (error) {
        if (!streamingComplete) {
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message
          })}\n\n`);
          res.end();
        }
      }

    } else {
      // Regular (non-streaming) response
      const result = await langchainApiClientService.convertNaturalLanguageToApiRequest(prompt);
      
      // Validate the generated API request
      const validation = langchainApiClientService.constructor.validateApiRequest(result.apiRequest);
      
      if (!validation.isValid) {
        logger.warn('Generated API request validation failed:', validation.errors);
        return res.json({
          success: false,
          error: 'Generated API request is invalid',
          validationErrors: validation.errors,
          apiRequest: result.apiRequest, // Include for debugging
          provider: result.provider
        });
      }

      logger.info(`✅ API Client: Successfully converted natural language to API request using ${result.provider}`);

      res.json({
        success: true,
        apiRequest: result.apiRequest,
        provider: result.provider,
        originalPrompt: result.originalPrompt,
        validation
      });
    }

  } catch (error) {
    logger.error('❌ API Client: Natural language conversion failed:', error.message);
    
    if (res.headersSent) {
      return; // Response already sent (streaming mode)
    }

    res.status(500).json({
      error: true,
      message: error.message || 'Failed to convert natural language to API request',
      success: false
    });
  }
};

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


