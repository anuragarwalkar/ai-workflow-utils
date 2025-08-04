import { JSDOM } from 'jsdom';
import logger from '../../../logger.js';

/**
 * TableExtractor - Processor for extracting table data from HTML content
 */
class TableExtractor {
  /**
   * Extracts table data as 2D array from HTML string for specific build number
   * @param {string} htmlString - HTML content to parse
   * @param {string} buildNumber - Build number to search for
   * @returns {Promise<Array>} 2D array representing table data
   */
  static async extractTableAsArray(htmlString, buildNumber) {
    try {
      if (!htmlString || typeof htmlString !== 'string') {
        throw new Error('Invalid HTML string provided');
      }

      if (!buildNumber || typeof buildNumber !== 'string') {
        throw new Error('Invalid build number provided');
      }

      logger.info('Parsing HTML content for table extraction', {
        htmlLength: htmlString.length,
        buildNumber,
      });

      const dom = new JSDOM(htmlString);
      const document = dom.window.document;

      // Find the heading for the specified build
      const heading = this._findBuildHeading(document, buildNumber);

      // Find the table associated with this heading
      const table = this._findAssociatedTable(heading);

      // Extract and clean table data
      const tableData = this._extractTableData(table);

      // Filter out empty rows
      const filteredData = this._filterEmptyRows(tableData);

      logger.info('Table extraction completed', {
        rowsExtracted: filteredData.length,
        buildNumber,
      });

      return filteredData;
    } catch (error) {
      logger.error('Table extraction failed', {
        error: error.message,
        buildNumber,
      });
      throw error;
    }
  }

  /**
   * Finds the heading element for the specified build number
   * @private
   * @param {Document} document - DOM document
   * @param {string} buildNumber - Build number to search for
   * @returns {Element} Heading element
   */
  static _findBuildHeading(document, buildNumber) {
    // Escape special regex characters in build number
    const safeBuild = buildNumber
      .replace(/\./g, '\\.')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

    const heading = document.querySelector(`h2[id*="${safeBuild}"]`);

    if (!heading) {
      throw new Error(`Heading not found for build: ${buildNumber}`);
    }

    return heading;
  }

  /**
   * Finds the table associated with the heading
   * @private
   * @param {Element} heading - Heading element
   * @returns {Element} Table element
   */
  static _findAssociatedTable(heading) {
    let currentElement = heading.nextElementSibling;
    let table = null;

    // Look for table in following siblings until next heading
    while (currentElement && !/^H[1-6]$/i.test(currentElement.tagName)) {
      if (
        currentElement.matches('.table-wrap') &&
        currentElement.querySelector('table')
      ) {
        table = currentElement.querySelector('table');
        break;
      }
      currentElement = currentElement.nextElementSibling;
    }

    if (!table) {
      throw new Error('Table not found for the build section');
    }

    return table;
  }

  /**
   * Extracts raw table data from table element
   * @private
   * @param {Element} table - Table element
   * @returns {Array} 2D array of raw table data
   */
  static _extractTableData(table) {
    const rows = Array.from(table.querySelectorAll('tr'));

    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      return cells.map(cell => {
        let text = cell.textContent.replace(/\s+/g, ' ').trim();
        // Clean up common artifacts
        text = text.replace(/\s+-\s+Getting issue details.*$/i, '');
        return text;
      });
    });
  }

  /**
   * Filters out rows where all cells are empty
   * @private
   * @param {Array} tableData - Raw table data
   * @returns {Array} Filtered table data
   */
  static _filterEmptyRows(tableData) {
    return tableData.filter(row => {
      return !row.every(cell => cell.trim() === '');
    });
  }

  /**
   * Validates extracted table data
   * @param {Array} tableData - Table data to validate
   * @returns {boolean} True if valid
   */
  static validateTableData(tableData) {
    if (!Array.isArray(tableData) || tableData.length === 0) {
      return false;
    }

    // Check if all rows are arrays and have at least one non-empty cell
    return tableData.every(
      row =>
        Array.isArray(row) && row.some(cell => cell && cell.trim().length > 0)
    );
  }
}

export { TableExtractor };
