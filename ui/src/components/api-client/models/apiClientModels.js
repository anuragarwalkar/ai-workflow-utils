// API Client Model Types

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
};

export const BODY_TYPES = {
  JSON: 'json',
  XML: 'xml',
  FORM_DATA: 'form-data',
  URL_ENCODED: 'x-www-form-urlencoded',
  RAW: 'raw',
  BINARY: 'binary',
};

export const AUTH_TYPES = {
  NONE: 'none',
  BEARER: 'bearer',
  BASIC: 'basic',
  API_KEY: 'api-key',
  OAUTH: 'oauth',
};

export const DEFAULT_REQUEST = {
  id: null,
  name: 'New Request',
  method: HTTP_METHODS.GET,
  url: '',
  headers: {},
  params: {},
  body: '',
  bodyType: BODY_TYPES.JSON,
  auth: {
    type: AUTH_TYPES.NONE,
    token: '',
    username: '',
    password: '',
    apiKey: '',
    apiKeyHeader: 'X-API-Key',
  },
};

export const DEFAULT_ENVIRONMENT = {
  id: null,
  name: 'New Environment',
  variables: {},
  isActive: false,
};

export const DEFAULT_COLLECTION = {
  id: null,
  name: 'New Collection',
  description: '',
  requests: [],
};

// Request validation
export const validateRequest = (request) => {
  const errors = [];
  
  if (!request.name?.trim()) {
    errors.push('Request name is required');
  }
  
  if (!request.method) {
    errors.push('HTTP method is required');
  }
  
  if (!request.url?.trim()) {
    errors.push('URL is required');
  } else {
    try {
      new URL(request.url);
    } catch {
      errors.push('Invalid URL format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Environment validation
export const validateEnvironment = (environment) => {
  const errors = [];
  
  if (!environment.name?.trim()) {
    errors.push('Environment name is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Collection validation
export const validateCollection = (collection) => {
  const errors = [];
  
  if (!collection.name?.trim()) {
    errors.push('Collection name is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
