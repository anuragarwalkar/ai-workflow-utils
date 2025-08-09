/**
 * Higher-order function that wraps a function with input validation
 * @param {Function} fn - The function to wrap
 * @param {Object} schema - Validation schema
 * @returns {Function} Wrapped function with validation
 */
export const withValidation = (fn, schema) => {
  return async (...args) => {
    // Handle different argument patterns
    const [firstArg] = args;
    
    // For functions that take a single primitive argument (like issueKey)
    if (Object.keys(schema).length === 1) {
      const [key, rules] = Object.entries(schema)[0];
      const value = firstArg;
      
      if (rules.required && (value === undefined || value === null)) {
        throw new Error(`${key} is required`);
      }
      
      if (value !== undefined && value !== null && rules.type) {
        if (rules.type === 'array' && !Array.isArray(value)) {
          throw new Error(`${key} must be an array`);
        }
        
        if (rules.type === 'string' && typeof value !== 'string') {
          throw new Error(`${key} must be a string`);
        }
        
        if (rules.type === 'array' && Array.isArray(value) && rules.minLength && value.length < rules.minLength) {
          throw new Error(`${key} must have at least ${rules.minLength} items`);
        }
        
        if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
          throw new Error(`${key} does not match required pattern`);
        }
      }
    }
    // For functions that take an object argument
    else if (typeof firstArg === 'object' && firstArg !== null) {
      for (const [key, rules] of Object.entries(schema)) {
        const value = firstArg[key];
        
        if (rules.required && (value === undefined || value === null)) {
          throw new Error(`${key} is required`);
        }
        
        if (value !== undefined && rules.type) {
          if (rules.type === 'array' && !Array.isArray(value)) {
            throw new Error(`${key} must be an array`);
          }
          
          if (rules.type === 'string' && typeof value !== 'string') {
            throw new Error(`${key} must be a string`);
          }
          
          if (rules.type === 'object' && typeof value !== 'object') {
            throw new Error(`${key} must be an object`);
          }
          
          if (rules.type === 'number' && typeof value !== 'number') {
            throw new Error(`${key} must be a number`);
          }
          
          if (rules.type === 'boolean' && typeof value !== 'boolean') {
            throw new Error(`${key} must be a boolean`);
          }
          
          if (rules.minLength && value.length < rules.minLength) {
            throw new Error(`${key} must have at least ${rules.minLength} items`);
          }
          
          if (rules.maxLength && value.length > rules.maxLength) {
            throw new Error(`${key} must have at most ${rules.maxLength} items`);
          }
          
          if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
            throw new Error(`${key} does not match required pattern`);
          }
        }
      }
    }
    // Handle case where object is expected but null/undefined is passed
    else if (firstArg === null || firstArg === undefined) {
      const requiredKeys = Object.entries(schema).filter(([key, rules]) => rules.required);
      if (requiredKeys.length > 0) {
        const [key] = requiredKeys[0];
        throw new Error(`${key} is required`);
      }
    }
    
    return await fn(...args);
  };
};

/**
 * Validates Express request body against a schema
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 */
export const validateRequestBody = (schema) => {
  return (req, res, next) => {
    try {
      for (const [key, rules] of Object.entries(schema)) {
        const value = req.body[key];
        
        if (rules.required && (value === undefined || value === null)) {
          return res.status(400).json({
            success: false,
            error: `${key} is required`,
          });
        }
        
        if (value !== undefined && rules.type) {
          if (rules.type === 'array' && !Array.isArray(value)) {
            return res.status(400).json({
              success: false,
              error: `${key} must be an array`,
            });
          }
          
          if (rules.type === 'string' && typeof value !== 'string') {
            return res.status(400).json({
              success: false,
              error: `${key} must be a string`,
            });
          }
          
          if (rules.type === 'object' && typeof value !== 'object') {
            return res.status(400).json({
              success: false,
              error: `${key} must be an object`,
            });
          }
          
          if (rules.minLength && value.length < rules.minLength) {
            return res.status(400).json({
              success: false,
              error: `${key} must have at least ${rules.minLength} items`,
            });
          }
          
          if (rules.maxLength && value.length > rules.maxLength) {
            return res.status(400).json({
              success: false,
              error: `${key} must have at most ${rules.maxLength} items`,
            });
          }
          
          if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
            return res.status(400).json({
              success: false,
              error: `${key} does not match required pattern`,
            });
          }
        }
      }
      
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: `Validation failed: ${error.message}`,
      });
    }
  };
};

/**
 * Validates Express request parameters against a schema
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 */
export const validateRequestParams = (schema) => {
  return (req, res, next) => {
    try {
      for (const [key, rules] of Object.entries(schema)) {
        const value = req.params[key];
        
        if (rules.required && (value === undefined || value === null)) {
          return res.status(400).json({
            success: false,
            error: `Parameter ${key} is required`,
          });
        }
        
        if (value !== undefined && rules.type) {
          if (rules.type === 'string' && typeof value !== 'string') {
            return res.status(400).json({
              success: false,
              error: `Parameter ${key} must be a string`,
            });
          }
          
          if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
            return res.status(400).json({
              success: false,
              error: `Parameter ${key} does not match required pattern`,
            });
          }
          
          if (rules.minLength && value.length < rules.minLength) {
            return res.status(400).json({
              success: false,
              error: `Parameter ${key} must have at least ${rules.minLength} characters`,
            });
          }
        }
      }
      
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: `Parameter validation failed: ${error.message}`,
      });
    }
  };
};

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  JIRA_ISSUE_KEY: /^[A-Z]+-\d+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  BRANCH_NAME: /^[a-zA-Z0-9/_-]+$/,
};

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  JIRA_ISSUE_KEYS: {
    issueKeys: {
      type: 'array',
      required: true,
      minLength: 1,
      maxLength: 50,
    },
  },
  
  JIRA_ISSUE_KEY: {
    issueKey: {
      type: 'string',
      required: true,
      pattern: ValidationPatterns.JIRA_ISSUE_KEY,
    },
  },
  
  EMAIL_GENERATION: {
    tableData: {
      type: 'array',
      required: true,
      minLength: 1,
    },
    metadata: {
      type: 'object',
      required: false,
    },
  },
  
  PR_GENERATION: {
    commits: {
      type: 'array',
      required: true,
      minLength: 1,
    },
    branchName: {
      type: 'string',
      required: true,
      pattern: ValidationPatterns.BRANCH_NAME,
    },
    ticketNumber: {
      type: 'string',
      required: false,
    },
  },
};
