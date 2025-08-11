/**
 * Type validation rules mapping
 */
const TYPE_VALIDATORS = {
  array: value => Array.isArray(value),
  string: value => typeof value === 'string',
  object: value => typeof value === 'object',
  number: value => typeof value === 'number',
  boolean: value => typeof value === 'boolean',
};

/**
 * Validates type-specific rules
 * @param {string} key - The field name
 * @param {*} value - The value to validate
 * @param {Object} rules - Validation rules
 */
const validateType = (key, value, rules) => {
  if (!rules.type) {
    return;
  }

  const validator = TYPE_VALIDATORS[rules.type];
  if (validator && !validator(value)) {
    throw new Error(`${key} must be a ${rules.type}`);
  }
};

/**
 * Validates length and pattern rules
 * @param {string} key - The field name
 * @param {*} value - The value to validate
 * @param {Object} rules - Validation rules
 */
const validateConstraints = (key, value, rules) => {
  if (rules.minLength && value.length < rules.minLength) {
    throw new Error(`${key} must have at least ${rules.minLength} items`);
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    throw new Error(`${key} must have at most ${rules.maxLength} items`);
  }

  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    throw new Error(`${key} does not match required pattern`);
  }
};

/**
 * Validates a single value against type rules
 * @param {string} key - The field name
 * @param {*} value - The value to validate
 * @param {Object} rules - Validation rules
 */
const validateValue = (key, value, rules) => {
  if (value === undefined || value === null) {
    return;
  }

  validateType(key, value, rules);
  validateConstraints(key, value, rules);
};

/**
 * Validates required fields
 * @param {string} key - The field name
 * @param {*} value - The value to validate
 * @param {Object} rules - Validation rules
 */
const validateRequired = (key, value, rules) => {
  if (rules.required && (value === undefined || value === null)) {
    throw new Error(`${key} is required`);
  }
};

/**
 * Validates a single argument against schema
 * @param {string} key - The field name
 * @param {*} value - The value to validate
 * @param {Object} rules - Validation rules
 */
const validateSingleField = (key, value, rules) => {
  validateRequired(key, value, rules);
  validateValue(key, value, rules);
};

/**
 * Validates multiple arguments against schema keys
 * @param {Array} args - Function arguments
 * @param {Array} schemaKeys - Schema keys in order
 * @param {Object} schema - Full schema object
 */
const validateMultipleArgs = (args, schemaKeys, schema) => {
  for (let i = 0; i < schemaKeys.length; i++) {
    const key = schemaKeys[i];
    const rules = schema[key];
    const value = args[i];
    validateSingleField(key, value, rules);
  }
};

/**
 * Validates object properties against schema
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Validation schema
 */
const validateObjectProperties = (obj, schema) => {
  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];
    validateSingleField(key, value, rules);
  }
};

/**
 * Higher-order function that wraps a function with input validation
 * @param {Function} fn - The function to wrap
 * @param {Object} schema - Validation schema
 * @returns {Function} Wrapped function with validation
 */
export const withValidation = (fn, schema) => {
  return async (...args) => {
    const [firstArg] = args;
    const schemaKeys = Object.keys(schema);

    // For functions that take a single primitive argument (like issueKey)
    if (schemaKeys.length === 1) {
      const [[key, rules]] = Object.entries(schema);
      const value = firstArg;
      validateSingleField(key, value, rules);
    }
    // For functions that take multiple arguments corresponding to schema keys
    else if (args.length === schemaKeys.length) {
      validateMultipleArgs(args, schemaKeys, schema);
    }
    // For functions that take an object argument
    else if (typeof firstArg === 'object' && firstArg !== null) {
      validateObjectProperties(firstArg, schema);
    }
    // Handle case where object is expected but null/undefined is passed
    else if (firstArg === null || firstArg === undefined) {
      const requiredKeys = Object.entries(schema).filter(([, rules]) => rules.required);
      if (requiredKeys.length > 0) {
        const [[key]] = requiredKeys;
        throw new Error(`${key} is required`);
      }
    }

    return await fn(...args);
  };
};

/**
 * Creates error response for validation failures
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendValidationError = (res, message) => {
  return res.status(400).json({
    success: false,
    error: message,
  });
};

/**
 * Validates a single field and sends error response if invalid
 * @param {Object} params - Validation parameters
 * @param {string} params.key - Field name
 * @param {*} params.value - Field value
 * @param {Object} params.rules - Validation rules
 * @param {Object} params.res - Express response object
 * @param {string} params.prefix - Error message prefix
 * @returns {boolean} True if valid, false if error response sent
 */
const validateFieldForExpress = ({ key, value, rules, res, prefix = '' }) => {
  try {
    validateSingleField(key, value, rules);
    return true;
  } catch (error) {
    const message = prefix ? `${prefix} ${error.message}` : error.message;
    sendValidationError(res, message);
    return false;
  }
};

/**
 * Validates Express request body against a schema
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 */
export const validateRequestBody = schema => {
  return (req, res, next) => {
    try {
      for (const [key, rules] of Object.entries(schema)) {
        const value = req.body[key];
        if (!validateFieldForExpress({ key, value, rules, res })) {
          return;
        }
      }
      next();
    } catch (error) {
      sendValidationError(res, `Validation failed: ${error.message}`);
    }
  };
};

/**
 * Validates Express request parameters against a schema
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 */
export const validateRequestParams = schema => {
  return (req, res, next) => {
    try {
      for (const [key, rules] of Object.entries(schema)) {
        const value = req.params[key];
        if (
          !validateFieldForExpress({
            key,
            value,
            rules,
            res,
            prefix: 'Parameter',
          })
        ) {
          return;
        }
      }
      next();
    } catch (error) {
      sendValidationError(res, `Parameter validation failed: ${error.message}`);
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
