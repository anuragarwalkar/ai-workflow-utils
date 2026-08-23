import { Request, Response, NextFunction, RequestHandler } from 'express';

const TYPE_VALIDATORS: Record<string, (value: any) => boolean> = {
  array: (value: any) => Array.isArray(value),
  string: (value: any) => typeof value === 'string',
  object: (value: any) => typeof value === 'object' && value !== null && !Array.isArray(value),
  number: (value: any) => typeof value === 'number' && !isNaN(value),
  boolean: (value: any) => typeof value === 'boolean',
};

export interface FieldValidationRule {
  type?: 'array' | 'string' | 'object' | 'number' | 'boolean';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export type ValidationSchema = Record<string, FieldValidationRule>;

const validateType = (key: string, value: any, rules: FieldValidationRule): void => {
  if (!rules.type) {
    return;
  }

  const validator = TYPE_VALIDATORS[rules.type];
  if (validator && !validator(value)) {
    throw new Error(`${key} must be a ${rules.type}`);
  }
};

const validateConstraints = (key: string, value: any, rules: FieldValidationRule): void => {
  if (rules.minLength !== undefined && value && value.length < rules.minLength) {
    throw new Error(`${key} must have at least ${rules.minLength} items`);
  }

  if (rules.maxLength !== undefined && value && value.length > rules.maxLength) {
    throw new Error(`${key} must have at most ${rules.maxLength} items`);
  }

  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    throw new Error(`${key} does not match required pattern`);
  }
};

const validateValue = (key: string, value: any, rules: FieldValidationRule): void => {
  if (value === undefined || value === null) {
    return;
  }

  validateType(key, value, rules);
  validateConstraints(key, value, rules);
};

const validateRequired = (key: string, value: any, rules: FieldValidationRule): void => {
  if (rules.required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
    throw new Error(`${key} is required`);
  }
};

const validateSingleField = (key: string, value: any, rules: FieldValidationRule): void => {
  validateRequired(key, value, rules);
  validateValue(key, value, rules);
};

const validateMultipleArgs = (args: any[], schemaKeys: string[], schema: ValidationSchema): void => {
  for (let i = 0; i < schemaKeys.length; i++) {
    const key = schemaKeys[i];
    const rules = schema[key];
    const value = args[i];
    validateSingleField(key, value, rules);
  }
};

const validateObjectProperties = (obj: Record<string, any>, schema: ValidationSchema): void => {
  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];
    validateSingleField(key, value, rules);
  }
};

export const withValidation = <T extends (...args: any[]) => any>(fn: T, schema: ValidationSchema) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const [firstArg] = args;
    const schemaKeys = Object.keys(schema);

    if (schemaKeys.length === 1) {
      const [[key, rules]] = Object.entries(schema);
      const value = firstArg;
      validateSingleField(key, value, rules);
    } else if (args.length === schemaKeys.length) {
      validateMultipleArgs(args, schemaKeys, schema);
    } else if (typeof firstArg === 'object' && firstArg !== null) {
      validateObjectProperties(firstArg, schema);
    } else if (firstArg === null || firstArg === undefined) {
      const requiredKeys = Object.entries(schema).filter(([, rules]) => rules.required);
      if (requiredKeys.length > 0) {
        const [[key]] = requiredKeys;
        throw new Error(`${key} is required`);
      }
    }

    return await fn(...args);
  };
};

const sendValidationError = (res: Response, message: string) => {
  return res.status(400).json({
    success: false,
    error: message,
  });
};

const validateFieldForExpress = ({
  key,
  value,
  rules,
  res,
  prefix = '',
}: {
  key: string;
  value: any;
  rules: FieldValidationRule;
  res: Response;
  prefix?: string;
}): boolean => {
  try {
    validateSingleField(key, value, rules);
    return true;
  } catch (error: any) {
    const message = prefix ? `${prefix} ${error.message}` : error.message;
    sendValidationError(res, message);
    return false;
  }
};

export const validateRequestBody = (schema: ValidationSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      for (const [key, rules] of Object.entries(schema)) {
        const value = req.body?.[key];
        if (!validateFieldForExpress({ key, value, rules, res })) {
          return;
        }
      }
      next();
    } catch (error: any) {
      sendValidationError(res, `Validation failed: ${error.message}`);
    }
  };
};

export const validateRequestParams = (schema: ValidationSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      for (const [key, rules] of Object.entries(schema)) {
        const value = req.params?.[key];
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
    } catch (error: any) {
      sendValidationError(res, `Parameter validation failed: ${error.message}`);
    }
  };
};

export const ValidationPatterns = {
  JIRA_ISSUE_KEY: /^[A-Z]+-\d+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  BRANCH_NAME: /^[a-zA-Z0-9/_-]+$/,
};

export const ValidationSchemas: Record<string, ValidationSchema> = {
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
