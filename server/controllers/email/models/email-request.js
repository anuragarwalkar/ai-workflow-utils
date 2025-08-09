/**
 * EmailRequest Model - Data validation and structure for email generation requests
 */
class EmailRequest {
  constructor(query = {}, body = {}) {
    this.version = query.version;
    this.wikiUrl = body.wikiUrl;
    this.wikiBasicAuth = body.wikiBasicAuth;
  }

  /**
   * Validates the email request data
   * @param {EmailRequest} emailRequest - The email request to validate
   * @throws {Error} If validation fails
   */
  static validate(emailRequest) {
    const required = ['version', 'wikiUrl', 'wikiBasicAuth'];
    const missing = required.filter(field => !emailRequest[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate URL format
    try {
      new URL(emailRequest.wikiUrl);
    } catch {
      throw new Error('Invalid wikiUrl format');
    }

    // Validate version format (basic check)
    if (
      typeof emailRequest.version !== 'string' ||
      emailRequest.version.trim().length === 0
    ) {
      throw new Error('Version must be a non-empty string');
    }

    // Validate basic auth format (should be base64 encoded)
    if (
      typeof emailRequest.wikiBasicAuth !== 'string' ||
      emailRequest.wikiBasicAuth.trim().length === 0
    ) {
      throw new Error('Wiki basic auth must be a non-empty string');
    }
  }

  /**
   * Sanitize and prepare the request data
   * @returns {Object} Sanitized request data
   */
  toSanitizedObject() {
    return {
      version: this.version?.trim(),
      wikiUrl: this.wikiUrl?.trim(),
      // Don't include auth in logs for security
      hasAuth: !!this.wikiBasicAuth,
    };
  }
}

export { EmailRequest };
