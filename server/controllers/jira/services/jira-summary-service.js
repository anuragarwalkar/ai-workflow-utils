/**
 * Jira summary service for summary fetching operations
 */

import { JiraApiService } from './jira-api-service.js';
import { ValidationUtils } from '../utils/validation-utils.js';
import { ErrorHandler } from '../utils/error-handler.js';
import logger from '../../../logger.js';

export class JiraSummaryService {
  /**
   * Fetch summaries for multiple issue keys (alias for fetchSummaries)
   * @param {Array<string>} issueKeys - Array of issue keys
   * @returns {Promise<Object>} Map of issue key to summary
   */
  static async fetchJiraSummaries(issueKeys) {
    return this.fetchSummaries(issueKeys);
  }

  /**
   * Fetch summaries for multiple issue keys
   * @param {Array<string>} issueKeys - Array of issue keys
   * @returns {Promise<Object>} Map of issue key to summary
   */
  static async fetchSummaries(issueKeys) {
    try {
      // Validate input
      const validation = ValidationUtils.validateIssueKeys(issueKeys);
      if (!validation.isValid) {
        throw ErrorHandler.createValidationError(validation.errors.join(', '));
      }

      // Remove duplicates and filter empty values
      const uniqueKeys = [...new Set(issueKeys.filter(Boolean))];

      if (uniqueKeys.length === 0) {
        return {};
      }

      logger.info('Fetching Jira summaries', {
        requestedKeys: issueKeys.length,
        uniqueKeys: uniqueKeys.length,
        keys: uniqueKeys,
      });

      // Fetch summaries from Jira API
      const summariesMap = await JiraApiService.fetchIssueSummaries(uniqueKeys);

      logger.info('Jira summaries fetched successfully', {
        requestedCount: uniqueKeys.length,
        foundCount: Object.keys(summariesMap).length,
        missingKeys: uniqueKeys.filter(key => !summariesMap[key]),
      });

      return summariesMap;
    } catch (error) {
      logger.error('Error fetching Jira summaries', {
        issueKeys,
        error: error.message,
      });

      // Return empty object for graceful degradation
      return {};
    }
  }

  /**
   * Merge Jira summaries with table data
   * @param {Array<Array>} tableData - 2D array representing table data
   * @returns {Promise<Array<Array>>} Updated table data with summaries
   */
  static async fetchAndMergeJiraSummary(tableData) {
    try {
      // Validate table data structure
      if (!Array.isArray(tableData) || tableData.length < 2) {
        throw ErrorHandler.createValidationError('Invalid table data');
      }

      const headers = tableData[0];
      const jiraKeyIndex = headers.indexOf('Jira URL');

      if (jiraKeyIndex === -1) {
        throw ErrorHandler.createValidationError('Missing \'Jira URL\' column');
      }

      logger.info('Processing table data for Jira summaries', {
        rowCount: tableData.length - 1,
        columnCount: headers.length,
        jiraUrlColumnIndex: jiraKeyIndex,
      });

      // Add 'Summary' column if not already present
      if (!headers.includes('Summary')) {
        headers.push('Summary');
      }

      // Extract Jira keys from table data
      const issueKeys = tableData
        .slice(1) // Skip header row
        .map(row => this.extractIssueKeyFromUrl(row[jiraKeyIndex]))
        .filter(Boolean); // Remove empty values

      logger.info('Extracted issue keys from table', {
        extractedKeys: issueKeys.length,
        uniqueKeys: [...new Set(issueKeys)].length,
      });

      // Fetch summaries
      const summariesMap = await this.fetchSummaries(issueKeys);

      // Merge summaries into table data
      const summaryColumnIndex = headers.length - 1;
      for (let i = 1; i < tableData.length; i++) {
        const row = tableData[i];
        const jiraUrl = row[jiraKeyIndex];
        const issueKey = this.extractIssueKeyFromUrl(jiraUrl);

        // Set summary or empty string if not found
        row[summaryColumnIndex] = summariesMap[issueKey] || '';
      }

      logger.info('Successfully merged Jira summaries with table data', {
        processedRows: tableData.length - 1,
        summariesFound: Object.keys(summariesMap).length,
      });

      return tableData;
    } catch (error) {
      logger.error('Error merging Jira summaries with table data', {
        error: error.message,
        tableDataLength: tableData?.length || 0,
      });
      throw error;
    }
  }

  /**
   * Extract issue key from Jira URL
   * @param {string} jiraUrl - Jira URL or issue key
   * @returns {string|null} Extracted issue key or null
   */
  static extractIssueKeyFromUrl(jiraUrl) {
    if (!jiraUrl || typeof jiraUrl !== 'string') {
      return null;
    }

    // If it's already an issue key (PROJECT-123 format)
    const directKeyMatch = jiraUrl.match(/^[A-Z]+-\d+$/);
    if (directKeyMatch) {
      return jiraUrl;
    }

    // Extract from URL patterns
    const urlPatterns = [
      /\/browse\/([A-Z]+-\d+)/, // Standard browse URL
      /\/issues\/([A-Z]+-\d+)/, // Issues URL
      /\/([A-Z]+-\d+)(?:\?|$)/, // Issue key at end of path
      /([A-Z]+-\d+)/, // Fallback: any issue key pattern
    ];

    for (const pattern of urlPatterns) {
      const match = jiraUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    logger.warn('Could not extract issue key from URL', { jiraUrl });
    return null;
  }

  /**
   * Get summaries for a specific project
   * @param {string} projectKey - Project key
   * @param {number} limit - Maximum number of issues to retrieve
   * @returns {Promise<Object>} Map of issue key to summary
   */
  static async getProjectSummaries(projectKey, limit = 100) {
    try {
      if (!projectKey || typeof projectKey !== 'string') {
        throw ErrorHandler.createValidationError('Project key is required');
      }

      const jql = `project = ${projectKey} ORDER BY created DESC`;
      const searchResult = await JiraApiService.searchIssues(
        jql,
        ['summary'],
        limit,
      );

      const summariesMap = {};
      if (searchResult.issues) {
        searchResult.issues.forEach(issue => {
          summariesMap[issue.key] = issue.fields.summary;
        });
      }

      logger.info('Fetched project summaries', {
        projectKey,
        totalFound: Object.keys(summariesMap).length,
        limit,
      });

      return summariesMap;
    } catch (error) {
      logger.error('Error fetching project summaries', {
        projectKey,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Search issues by summary text
   * @param {string} searchText - Text to search in summaries
   * @param {string} projectKey - Optional project key to limit search
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Array of issues with summaries
   */
  static async searchBySummary(searchText, projectKey = null, limit = 50) {
    try {
      if (!searchText || typeof searchText !== 'string') {
        throw ErrorHandler.createValidationError('Search text is required');
      }

      let jql = `summary ~ "${searchText}"`;
      if (projectKey) {
        jql = `project = ${projectKey} AND ${jql}`;
      }
      jql += ' ORDER BY updated DESC';

      const searchResult = await JiraApiService.searchIssues(
        jql,
        ['summary', 'status', 'assignee'],
        limit,
      );

      const issues =
        searchResult.issues?.map(issue => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status?.name,
          assignee: issue.fields.assignee?.displayName,
        })) || [];

      logger.info('Search by summary completed', {
        searchText,
        projectKey,
        resultsFound: issues.length,
      });

      return issues;
    } catch (error) {
      logger.error('Error searching by summary', {
        searchText,
        projectKey,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get summary statistics for a project
   * @param {string} projectKey - Project key
   * @returns {Promise<Object>} Summary statistics
   */
  static async getSummaryStats(projectKey) {
    try {
      const summaries = await this.getProjectSummaries(projectKey, 1000);
      const summaryTexts = Object.values(summaries);

      const stats = {
        totalIssues: summaryTexts.length,
        averageLength:
          summaryTexts.length > 0
            ? Math.round(
              summaryTexts.reduce((sum, text) => sum + text.length, 0) /
                  summaryTexts.length,
            )
            : 0,
        longestSummary: Math.max(...summaryTexts.map(text => text.length), 0),
        shortestSummary:
          summaryTexts.length > 0
            ? Math.min(...summaryTexts.map(text => text.length))
            : 0,
        commonWords: this.getCommonWords(summaryTexts),
      };

      logger.info('Generated summary statistics', {
        projectKey,
        ...stats,
      });

      return stats;
    } catch (error) {
      logger.error('Error generating summary statistics', {
        projectKey,
        error: error.message,
      });
      return {
        totalIssues: 0,
        averageLength: 0,
        longestSummary: 0,
        shortestSummary: 0,
        commonWords: [],
      };
    }
  }

  /**
   * Extract common words from summaries
   * @param {Array<string>} summaries - Array of summary texts
   * @returns {Array} Top 10 common words
   */
  static getCommonWords(summaries) {
    const wordCounts = {};
    const stopWords = new Set([
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'a',
      'an',
    ]);

    summaries.forEach(summary => {
      const words = summary
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));

      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }
}
