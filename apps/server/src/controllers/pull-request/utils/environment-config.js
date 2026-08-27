import loadEnvironment from '../../../utils/envLoader.ts';

/**
 * Environment configuration management for PR operations
 */
class EnvironmentConfig {
  static get() {
    if (!process.env.BIT_BUCKET_URL || !process.env.BITBUCKET_AUTHORIZATION_TOKEN) {
      loadEnvironment({ verbose: false });
    }

    const rawUrl = process.env.BIT_BUCKET_URL;
    const bitbucketUrl = rawUrl ? rawUrl.trim().replace(/\/+$/, '') : undefined;
    const authToken = process.env.BITBUCKET_AUTHORIZATION_TOKEN
      ? process.env.BITBUCKET_AUTHORIZATION_TOKEN.trim()
      : undefined;

    return {
      bitbucketUrl,
      authToken,
      openaiBaseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL,
      openaiApiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
      openaiModel: process.env.OPENAI_COMPATIBLE_MODEL,
    };
  }

  static validate() {
    const { bitbucketUrl, authToken } = this.get();
    const missing = [];

    if (!bitbucketUrl) missing.push('BIT_BUCKET_URL');
    if (!authToken) missing.push('BITBUCKET_AUTHORIZATION_TOKEN');

    if (missing.length > 0) {
      throw new Error(
        `Required environment variables are missing: ${missing.join(', ')}. Please configure them in your .env file or via Settings > Environment.`
      );
    }

    try {
      new URL(bitbucketUrl);
    } catch {
      throw new Error(
        `Invalid BIT_BUCKET_URL format: "${bitbucketUrl}". Expected a valid URL (e.g., https://bitbucket.yourcompany.com).`
      );
    }
  }
}

export default EnvironmentConfig;
