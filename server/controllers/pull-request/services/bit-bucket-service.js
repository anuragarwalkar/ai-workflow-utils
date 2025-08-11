import axios from 'axios';
import https from 'https';
import logger from '../../../logger.js';
import EnvironmentConfig from '../utils/environment-config.js';
import { DEFAULT_COMMIT_LIMIT } from '../utils/constants.js';

// Create axios instance with SSL certificate verification disabled for self-signed certificates
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Ignore self-signed certificate errors
  }),
});

/**
 * Service for Bitbucket API operations
 */
class BitbucketService {
  /**
   * Get pull requests for a specific project and repository
   */
  static async getPullRequests(projectKey, repoSlug) {
    const { bitbucketUrl, authToken } = EnvironmentConfig.get();
    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`;

    logger.info(`Fetching pull requests from: ${url}`);

    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    logger.info(`Successfully fetched ${response.data.values?.length || 0} pull requests`);
    return response.data;
  }

  /**
   * Get diff for a specific pull request
   */
  static async getPullRequestDiff(projectKey, repoSlug, pullRequestId) {
    const { bitbucketUrl, authToken } = EnvironmentConfig.get();
    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/diff`;

    logger.info(`Fetching PR diff from: ${url}`);

    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    logger.info(`Successfully fetched diff for PR ${pullRequestId}`);
    return response.data;
  }

  /**
   * Get commit messages from a branch
   */
  static async getCommitMessages(projectKey, repoSlug, branchName) {
    const { bitbucketUrl, authToken } = EnvironmentConfig.get();
    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/commits`;

    logger.info(`Fetching commits from branch ${branchName}: ${url}`);

    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      params: {
        since: 'main',
        until: branchName,
        limit: DEFAULT_COMMIT_LIMIT,
      },
    });

    if (response.data && response.data.values) {
      const commits = response.data.values.map(commit => ({
        id: commit.id,
        message: commit.message,
        author: commit.author.name,
        date: commit.authorTimestamp,
      }));

      logger.info(`Successfully fetched ${commits.length} commits from branch ${branchName}`);
      return commits;
    }

    return [];
  }

  /**
   * Create a pull request
   */
  static async createPullRequest(projectKey, repoSlug, payload) {
    const { bitbucketUrl, authToken } = EnvironmentConfig.get();
    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`;

    logger.info(`Creating pull request with title: "${payload.title}"`);

    const response = await axiosInstance.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    logger.info('Pull request created successfully');
    return response.data;
  }
}

export default BitbucketService;
