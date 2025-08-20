/**
 * Centralized logging utility for consistent log formatting across UI components
 * Format: [COMPONENT_NAME] [FUNCTION_NAME] message
 */

/* eslint-disable no-console */

/**
 * Creates a logger instance for a specific component
 * @param {string} componentName - Name of the component (e.g., 'CreatePRContainer')
 * @returns {object} Logger instance with methods for different log levels
 */
export const createLogger = (componentName) => {
  const formatMessage = (functionName, message) => 
    `[${componentName}] [${functionName}] ${message}`;

  return {
    /**
     * Log an info message
     * @param {string} functionName - Name of the function calling the logger
     * @param {string} message - Log message
     * @param {any} data - Optional data to log
     */
    info: (functionName, message, data = null) => {
      const formattedMessage = formatMessage(functionName, message);
      if (data !== null) {
        console.log(formattedMessage, data);
      } else {
        console.log(formattedMessage);
      }
    },

    /**
     * Log an error message
     * @param {string} functionName - Name of the function calling the logger
     * @param {string} message - Error message
     * @param {any} error - Optional error object or data
     */
    error: (functionName, message, error = null) => {
      const formattedMessage = formatMessage(functionName, message);
      if (error !== null) {
        console.error(formattedMessage, error);
      } else {
        console.error(formattedMessage);
      }
    },

    /**
     * Log a warning message
     * @param {string} functionName - Name of the function calling the logger
     * @param {string} message - Warning message
     * @param {any} data - Optional data to log
     */
    warn: (functionName, message, data = null) => {
      const formattedMessage = formatMessage(functionName, message);
      if (data !== null) {
        console.warn(formattedMessage, data);
      } else {
        console.warn(formattedMessage);
      }
    },

    /**
     * Log a debug message (only in development)
     * @param {string} functionName - Name of the function calling the logger
     * @param {string} message - Debug message
     * @param {any} data - Optional data to log
     */
    debug: (functionName, message, data = null) => {
      if (import.meta.env.DEV) {
        const formattedMessage = formatMessage(functionName, message);
        if (data !== null) {
          console.debug(formattedMessage, data);
        } else {
          console.debug(formattedMessage);
        }
      }
    },
  };
};

/**
 * Default logger instance (use createLogger for component-specific logging)
 */
export const logger = createLogger('App');
