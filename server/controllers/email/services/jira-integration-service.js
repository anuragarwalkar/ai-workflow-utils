import { fetchJiraSummaries } from '../../jira/index.js';
import logger from '../../../logger.js';

/**
 * JiraIntegrationService - Handles Jira integration and data enhancement
 */
class JiraIntegrationService {
  /**
   * Enhances table data with Jira summaries
   * @param {Array} tableData - 2D array representing table data
   * @returns {Promise<Array>} Enhanced table data with Jira summaries
   */
  static async enhanceWithJiraSummaries(tableData) {
    try {
      if (!Array.isArray(tableData) || tableData.length < 2) {
        throw new Error("Invalid table data: must be array with at least headers and one row");
      }

      logger.info('Enhancing table data with Jira summaries', {
        rowCount: tableData.length
      });

      const headers = tableData[0];
      const jiraKeyIndex = headers.indexOf('Jira URL');

      if (jiraKeyIndex === -1) {
        logger.warn("No 'Jira URL' column found, skipping Jira enhancement");
        return tableData;
      }

      // Add 'Summary' column if not already present
      if (!headers.includes('Summary')) {
        headers.push('Summary');
      }

      // Extract Jira keys from the table
      const issueKeys = this._extractJiraKeys(tableData, jiraKeyIndex);
      
      if (issueKeys.length === 0) {
        logger.info('No Jira keys found in table data');
        return tableData;
      }

      // Fetch summaries from Jira
      const summariesMap = await this._fetchJiraSummariesSafely(issueKeys);

      // Enhance table rows with summaries
      this._addSummariesToTable(tableData, jiraKeyIndex, headers.length - 1, summariesMap);

      logger.info('Table data enhanced successfully', {
        jiraKeysProcessed: issueKeys.length,
        summariesRetrieved: Object.keys(summariesMap).length
      });

      return tableData;

    } catch (error) {
      logger.error('Failed to enhance table data with Jira summaries', {
        error: error.message
      });
      throw new Error(`Jira enhancement failed: ${error.message}`);
    }
  }

  /**
   * Extracts Jira keys from table data
   * @private
   * @param {Array} tableData - Table data
   * @param {number} jiraKeyIndex - Index of Jira URL column
   * @returns {Array} Array of unique Jira keys
   */
  static _extractJiraKeys(tableData, jiraKeyIndex) {
    const issueKeys = tableData
      .slice(1) // Skip header row
      .map(row => row[jiraKeyIndex])
      .filter(Boolean) // Remove empty values
      .filter((key, index, arr) => arr.indexOf(key) === index); // Remove duplicates

    return issueKeys;
  }

  /**
   * Safely fetches Jira summaries with error handling
   * @private
   * @param {Array} issueKeys - Array of Jira issue keys
   * @returns {Promise<Object>} Map of issue keys to summaries
   */
  static async _fetchJiraSummariesSafely(issueKeys) {
    try {
      const summariesMap = await fetchJiraSummaries(issueKeys);
      return summariesMap || {};
    } catch (error) {
      logger.error('Failed to fetch Jira summaries', {
        error: error.message,
        issueKeys: issueKeys.length
      });
      // Return empty map to allow email generation to continue
      return {};
    }
  }

  /**
   * Adds summaries to table rows
   * @private
   * @param {Array} tableData - Table data to modify
   * @param {number} jiraKeyIndex - Index of Jira URL column
   * @param {number} summaryIndex - Index where summary should be added
   * @param {Object} summariesMap - Map of issue keys to summaries
   */
  static _addSummariesToTable(tableData, jiraKeyIndex, summaryIndex, summariesMap) {
    for (let i = 1; i < tableData.length; i++) {
      const row = tableData[i];
      const jiraKey = row[jiraKeyIndex];
      
      // Ensure row has enough columns
      while (row.length <= summaryIndex) {
        row.push('');
      }
      
      row[summaryIndex] = summariesMap[jiraKey] || '';
    }
  }
}

export { JiraIntegrationService };
