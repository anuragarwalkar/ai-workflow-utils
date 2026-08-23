import { Request, Response } from 'express';
import axios from 'axios';
import https from 'https';
import logger from '../../logger.ts';
import langchainApiClientService from '../../services/langchain/LangChainApiClientService.ts';

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

export const convertNaturalLanguageToApi = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, streaming = false } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({
        error: true,
        message: 'Natural language prompt is required',
      });
      return;
    }

    logger.info(`🤖 API Client: Converting natural language prompt: "${prompt.substring(0, 100)}..."`);

    await langchainApiClientService.initialize();

    if (streaming) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      let streamingComplete = false;

      const streamCallback = (data: any) => {
        if (!streamingComplete) {
          try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);

            if (data.type === 'complete') {
              streamingComplete = true;
              langchainApiClientService
                .parseAndEnhanceResponse(data.fullContent)
                .then(apiRequest => {
                  res.write(
                    `data: ${JSON.stringify({
                      type: 'final',
                      apiRequest,
                      provider: data.provider,
                    })}\n\n`
                  );
                  res.write('data: [DONE]\n\n');
                  res.end();
                })
                .catch((error: any) => {
                  res.write(
                    `data: ${JSON.stringify({
                      type: 'error',
                      error: error.message,
                    })}\n\n`
                  );
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

      req.on('close', () => {
        streamingComplete = true;
        logger.info('Client disconnected from natural language streaming');
      });

      try {
        await langchainApiClientService.convertNaturalLanguageToApiRequest(prompt, streamCallback);
      } catch (error: any) {
        if (!streamingComplete) {
          res.write(
            `data: ${JSON.stringify({
              type: 'error',
              error: error.message,
            })}\n\n`
          );
          res.end();
        }
      }
    } else {
      const result = await langchainApiClientService.convertNaturalLanguageToApiRequest(prompt);

      const validation = (langchainApiClientService.constructor as any).validateApiRequest(result.apiRequest);

      if (!validation.isValid) {
        logger.warn('Generated API request validation failed:', validation.errors);
        res.json({
          success: false,
          error: 'Generated API request is invalid',
          validationErrors: validation.errors,
          apiRequest: result.apiRequest,
          provider: result.provider,
        });
        return;
      }

      logger.info(`✅ API Client: Successfully converted natural language to API request using ${result.provider}`);

      res.json({
        success: true,
        apiRequest: result.apiRequest,
        provider: result.provider,
        originalPrompt: result.originalPrompt,
        validation,
      });
    }
  } catch (error: any) {
    logger.error('❌ API Client: Natural language conversion failed:', error.message);

    if (res.headersSent) {
      return;
    }

    res.status(500).json({
      error: true,
      message: error.message || 'Failed to convert natural language to API request',
      success: false,
    });
  }
};

export const executeScript = async (req: Request, res: Response): Promise<void> => {
  try {
    const { script, context = {} } = req.body;

    if (!script || typeof script !== 'string') {
      res.status(400).json({
        error: true,
        message: 'Script code is required',
      });
      return;
    }

    logger.info('🔧 API Client: Executing script');

    const scriptContext: any = {
      console: {
        log: (...args: any[]) => logger.info('Script log:', ...args),
        error: (...args: any[]) => logger.error('Script error:', ...args),
        warn: (...args: any[]) => logger.warn('Script warn:', ...args),
      },
      ...context,
      setEnvironmentVariable: (key: string, value: any) => {
        if (!scriptContext.environment) scriptContext.environment = {};
        scriptContext.environment[key] = value;
      },
      getEnvironmentVariable: (key: string) => {
        return scriptContext.environment?.[key];
      },
    };

    try {
      const vm = await import('vm');
      const vmContext = vm.createContext({
        console: scriptContext.console,
        setEnvironmentVariable: scriptContext.setEnvironmentVariable,
        getEnvironmentVariable: scriptContext.getEnvironmentVariable,
        environment: context.environment || {},
        request: context.request || {},
        response: context.response || {},
        JSON,
        Date,
        Math,
        parseInt,
        parseFloat,
        encodeURIComponent,
        decodeURIComponent,
      });

      const result = vm.runInContext(script, vmContext, {
        timeout: 5000,
        displayErrors: true,
      });

      logger.info('✅ API Client: Script executed successfully');

      res.json({
        success: true,
        result,
        environment: (vmContext as any).environment || {},
        logs: [],
      });
    } catch (scriptError: any) {
      logger.error('❌ API Client: Script execution failed:', scriptError.message);

      res.json({
        success: false,
        error: scriptError.message,
        stack: scriptError.stack,
      });
    }
  } catch (error: any) {
    logger.error('❌ API Client: Script execution setup failed:', error.message);

    res.status(500).json({
      error: true,
      message: error.message || 'Failed to execute script',
      success: false,
    });
  }
};

const executeScriptSafely = async (script: string, context: any): Promise<any> => {
  if (!script || !script.trim()) return { success: true, environment: context.environment || {} };

  try {
    const vm = await import('vm');
    const vmContext = vm.createContext({
      console: {
        log: (...args: any[]) => logger.info('Script log:', ...args),
        error: (...args: any[]) => logger.error('Script error:', ...args),
        warn: (...args: any[]) => logger.warn('Script warn:', ...args),
      },
      setEnvironmentVariable: (key: string, value: any) => {
        if (!context.environment) context.environment = {};
        context.environment[key] = value;
      },
      getEnvironmentVariable: (key: string) => {
        return context.environment?.[key];
      },
      environment: { ...(context.environment || {}) },
      request: context.request || {},
      response: context.response || {},
      JSON,
      Date,
      Math,
      parseInt,
      parseFloat,
      encodeURIComponent,
      decodeURIComponent,
    });

    vm.runInContext(script, vmContext, {
      timeout: 5000,
      displayErrors: true,
    });

    return {
      success: true,
      environment: (vmContext as any).environment || context.environment || {},
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      environment: context.environment || {},
    };
  }
};

export const executeRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      method,
      url,
      headers = {},
      params = {},
      body,
      bodyType,
      auth,
      preScript,
      postScript,
      environment = {},
    } = req.body;

    if (!url) {
      res.status(400).json({
        error: true,
        message: 'URL is required',
      });
      return;
    }

    if (!method) {
      res.status(400).json({
        error: true,
        message: 'HTTP method is required',
      });
      return;
    }

    logger.info(`🌐 API Client: Executing ${method.toUpperCase()} request to ${url}`);

    let currentEnvironment = { ...environment };
    let preScriptResult = { success: true, error: undefined, environment: currentEnvironment };

    if (preScript && preScript.trim()) {
      logger.info('🔧 API Client: Executing pre-request script');
      preScriptResult = await executeScriptSafely(preScript, {
        environment: currentEnvironment,
        request: { method, url, headers, params, body, bodyType, auth },
      });

      if (!preScriptResult.success) {
        res.json({
          error: true,
          message: `Pre-request script failed: ${preScriptResult.error}`,
          preScriptError: preScriptResult.error,
          status: 0,
          responseTime: 0,
          size: 0,
        });
        return;
      }

      currentEnvironment = preScriptResult.environment;
    }

    const requestHeaders = { ...headers };

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

    const axiosConfig: any = {
      method: method.toLowerCase(),
      url,
      headers: requestHeaders,
      params,
      timeout: 30000,
      validateStatus: () => true,
    };

    if (['post', 'put', 'patch'].includes(method.toLowerCase()) && body) {
      if (bodyType === 'json') {
        try {
          axiosConfig.data = typeof body === 'string' ? JSON.parse(body) : body;
          axiosConfig.headers['Content-Type'] = 'application/json';
        } catch (error) {
          res.status(400).json({
            error: true,
            message: 'Invalid JSON in request body',
          });
          return;
        }
      } else if (bodyType === 'form-data') {
        axiosConfig.data = body;
        axiosConfig.headers['Content-Type'] = 'multipart/form-data';
      } else if (bodyType === 'x-www-form-urlencoded') {
        axiosConfig.data = body;
        axiosConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        axiosConfig.data = body;
        axiosConfig.headers['Content-Type'] = 'text/plain';
      }
    }

    const startTime = Date.now();
    const response = await axiosInstance(axiosConfig);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const responseSize = JSON.stringify(response.data || '').length;

    logger.info(
      `✅ API Client: Request completed - Status: ${response.status}, Time: ${responseTime}ms, Size: ${responseSize}B`
    );

    const apiResponse: any = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime,
      size: responseSize,
      contentType: response.headers['content-type'] || 'unknown',
      error: false,
      environment: currentEnvironment,
    };

    if (postScript && postScript.trim()) {
      logger.info('🔧 API Client: Executing post-response script');
      const postScriptResult = await executeScriptSafely(postScript, {
        environment: currentEnvironment,
        request: { method, url, headers: requestHeaders, params, body, bodyType, auth },
        response: apiResponse,
      });

      if (!postScriptResult.success) {
        apiResponse.postScriptError = postScriptResult.error;
        logger.warn('⚠️ API Client: Post-response script failed:', postScriptResult.error);
      }

      apiResponse.environment = postScriptResult.environment;
    }

    res.json(apiResponse);
  } catch (error: any) {
    logger.error('❌ API Client request failed:', error.message);

    if (error.response) {
      res.json({
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
      res.json({
        error: true,
        message: 'No response received from server (network error)',
        status: 0,
        responseTime: 0,
        size: 0,
      });
    } else {
      res.status(500).json({
        error: true,
        message: error.message || 'Request configuration error',
        status: 0,
        responseTime: 0,
        size: 0,
      });
    }
  }
};
