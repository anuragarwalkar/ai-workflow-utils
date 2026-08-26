/**
 * Environment Request Model
 * Handles validation and processing of environment settings requests
 */
export class EnvironmentRequest {
  constructor(requestData) {
    this.rawUpdates = requestData || {};
  }

  /**
   * Get valid updates by filtering out empty strings and undefined values
   * @returns {Object} Filtered updates object
   */
  getValidUpdates() {
    return Object.entries(this.rawUpdates).reduce((acc, [key, value]) => {
      // Only include values that are not empty strings and not undefined
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  /**
   * Validate the updates object
   * @param {Object} updates - Updates to validate
   * @throws {Error} If validation fails
   */
  static validate(updates) {
    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates must be a valid object');
    }

    // Additional validation can be added here based on specific requirements
    // For now, we rely on the environment service validation
  }
}
