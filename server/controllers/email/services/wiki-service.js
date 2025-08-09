import { TableExtractor } from '../processors/table-extractor.js';
import logger from '../../../logger.js';

/**
 * WikiService - Handles wiki content fetching and processing
 */
class WikiService {
  /**
   * Fetches content from wiki URL with authentication
   * @param {string} wikiUrl - The wiki URL to fetch
   * @param {string} basicAuth - Basic authentication token
   * @returns {Promise<string>} HTML content from wiki
   */
  static async fetchWikiContent(wikiUrl, basicAuth) {
    try {
      const headers = new Headers();
      headers.append('Accept', 'application/json');
      headers.append('Authorization', `Basic ${basicAuth}`);

      const requestOptions = {
        method: 'GET',
        headers,
        redirect: 'follow',
      };

      logger.info('Fetching wiki content', { wikiUrl });

      const response = await fetch(wikiUrl, requestOptions);

      if (!response.ok) {
        throw new Error(
          `Wiki fetch failed with status: ${response.status} ${response.statusText}`,
        );
      }

      const htmlContent = await response.text();

      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('Received empty content from wiki');
      }

      logger.info('Wiki content fetched successfully', {
        contentLength: htmlContent.length,
      });

      return htmlContent;
    } catch (error) {
      logger.error('Failed to fetch wiki content', {
        error: error.message,
        wikiUrl,
      });
      throw new Error(`Wiki content fetch failed: ${error.message}`);
    }
  }

  /**
   * Extracts table data from HTML content for specific version
   * @param {string} htmlContent - HTML content from wiki
   * @param {string} version - Build version to extract table for
   * @returns {Promise<Array>} Extracted table data as 2D array
   */
  static async extractTableData(htmlContent, version) {
    try {
      logger.info('Extracting table data', { version });

      const tableData = await TableExtractor.extractTableAsArray(
        htmlContent,
        version,
      );

      if (!Array.isArray(tableData) || tableData.length === 0) {
        throw new Error('No table data extracted from wiki content');
      }

      logger.info('Table data extracted successfully', {
        rowCount: tableData.length,
        columnCount: tableData[0]?.length || 0,
      });

      return tableData;
    } catch (error) {
      logger.error('Failed to extract table data', {
        error: error.message,
        version,
      });
      throw new Error(`Table extraction failed: ${error.message}`);
    }
  }
}

export { WikiService };
