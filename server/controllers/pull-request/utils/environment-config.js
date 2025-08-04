import dotenv from 'dotenv';

/**
 * Environment configuration management for PR operations
 */
class EnvironmentConfig {
  static get() {
    dotenv.config();

    return {
      bitbucketUrl: process.env.BIT_BUCKET_URL,
      authToken: process.env.BITBUCKET_AUTHORIZATION_TOKEN,
      openaiBaseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL,
      openaiApiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
      openaiModel: process.env.OPENAI_COMPATIBLE_MODEL,
    };
  }

  static validate() {
    const { bitbucketUrl, authToken } = this.get();
    if (!bitbucketUrl || !authToken) {
      throw new Error(
        'Required environment variables are missing: BIT_BUCKET_URL, BITBUCKET_AUTHORIZATION_TOKEN'
      );
    }
  }
}

export default EnvironmentConfig;
